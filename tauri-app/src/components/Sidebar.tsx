import { useEffect, useState } from "react";
import { getDatabase, Subscription } from "../db";
import { syncSubscriptions } from "../sync";
import { MembershipCardIcon } from "./icons/MembershipCardIcon";
import { DeleteIcon } from "./icons/DeleteIcon";

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

    async function handleUnsubscribe(id: string) {
        const db = await getDatabase();
        const doc = await db.subscriptions.findOne(id).exec();
        if (doc) await doc.patch({ isDeleted: true });
        if (userId) syncSubscriptions(userId).catch(console.error);
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
                            <div className="group flex items-center gap-2">
                                <button
                                    className="flex items-center gap-2 flex-1 min-w-0"
                                    onClick={() => onChannelClick(s.channelId, s.channelName)}
                                >
                                    {s.channelThumbnail ? (
                                        <div className="avatar">
                                            <div className="w-7 rounded-full">
                                                <img src={s.channelThumbnail} alt={s.channelName} />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="avatar avatar-placeholder">
                                            <div className="bg-neutral text-neutral-content w-7 rounded-full">
                                                <span className="text-xs">{s.channelName[0]}</span>
                                            </div>
                                        </div>
                                    )}
                                    <span className="truncate">{s.channelName}</span>
                                </button>
                                <button
                                    className="btn btn-ghost btn-xs btn-square btn-error opacity-0 group-hover:opacity-100 transition-opacity"
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
                        <a>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                        </a>
                    </li>
                    <li>
                        <a>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </a>
                    </li>
                    <li>
                        <a>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </a>
                    </li>
                </ul>
            </div>
        </>

    );
}
