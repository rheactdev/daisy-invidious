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
    </>
  );
}
