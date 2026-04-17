import { useEffect, useState, useCallback } from "react";
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { getDatabase, Subscription } from "../db";
import { syncSubscriptions } from "../sync";
import { MembershipCardIcon } from "./icons/MembershipCardIcon";
import { DeleteIcon } from "./icons/DeleteIcon";
import { SettingsIcon } from "./icons/SettingsIcon";

interface SidebarProps {
    onChannelClick: (channelId: string, channelName: string) => void;
    userId: string | null;
}

export default function Sidebar({ onChannelClick, userId }: SidebarProps) {
    const [subs, setSubs] = useState<Subscription[]>([]);

    useEffect(() => {
        let sub: { unsubscribe: () => void } | undefined;
        getDatabase().then((db) => {
            sub = db.subscriptions
                .find({ selector: { isDeleted: false } })
                .$.subscribe((docs) => {
                    const list = docs.map((d) => d.toMutableJSON());
                    list.sort((a, b) => a.channelName.localeCompare(b.channelName));
                    setSubs(list);
                });
        });
        return () => sub?.unsubscribe();
    }, []);

    const handleUnsubscribe = useCallback(async (id: string) => {
        const db = await getDatabase();
        const doc = await db.subscriptions.findOne(id).exec();
        if (doc) await doc.patch({ isDeleted: true });
        if (userId) syncSubscriptions(userId).catch(console.error);
    }, [userId]);

    const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

    async function checkForUpdates() {
        try {
            setIsCheckingUpdate(true);
            const update = await check();
            if (update) {
                const confirmed = confirm(`Update v${update.version} available. Install and restart?`);
                if (confirmed) {
                    await update.downloadAndInstall();
                    await relaunch();
                }
            } else {
                alert('No updates available. You are on the latest version.');
            }
        } catch (error) {
            console.error('Update check failed', error);
            alert('Failed to check for updates: ' + error);
        } finally {
            setIsCheckingUpdate(false);
        }
    }

    return (
        <>
            <div>
                <li className="menu-title flex flex-row items-center justify-start gap-2 px-2 my-0 py-0">
                    <MembershipCardIcon size={36} />
                    <span>Subscriptions</span>
                </li>
                <div className="divider m-0 p-0" />
                {subs.length === 0 ? (
                    <li className="disabled">
                        <span className="opacity-50 text-xs italic">No subscriptions yet</span>
                    </li>
                ) : (
                    subs.map((s) => (
                        <li key={s.id}>
                            <div className="group flex items-center w-48 justify-between p-2">
                                <button
                                    className="flex items-center gap-2 truncate"
                                    onClick={() => onChannelClick(s.channelId, s.channelName)}
                                >
                                    {s.channelThumbnail ? (
                                        <div className="avatar">
                                            <div className="w-7 rounded-full">
                                                <img src={s.channelThumbnail} alt={s.channelName} loading="lazy" decoding="async" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="avatar avatar-placeholder shrink-0">
                                            <div className="bg-neutral text-neutral-content w-7 rounded-full">
                                                <span className="text-xs">{s.channelName[0]}</span>
                                            </div>
                                        </div>
                                    )}
                                    <span className="truncate">{s.channelName}</span>
                                </button>
                                <button
                                    className="btn btn-ghost btn-xs btn-square btn-error opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                    onClick={(e) => { e.stopPropagation(); handleUnsubscribe(s.id); }}
                                >
                                    <DeleteIcon size={16} />
                                </button>
                            </div>
                        </li>
                    ))
                )}
            </div>
            <div>
                <ul className="menu menu-horizontal bg-base-200 rounded-box">
                    <li>
                        <a onClick={checkForUpdates} className={isCheckingUpdate ? "opacity-50 pointer-events-none" : ""}>
                            <SettingsIcon size={24} />
                            {isCheckingUpdate ? "Checking..." : "Check for Updates"}
                        </a>
                    </li>
                </ul>
            </div>
        </>

    );
}
