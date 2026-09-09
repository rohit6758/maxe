const fs = require('fs');
let content = fs.readFileSync('src/screens/Explore.jsx', 'utf8');

// 1. Add typingUsers state
if (!content.includes('const [typingUsers, setTypingUsers] = useState([]);')) {
  content = content.replace(
    'const [joinRequestStatus, setJoinRequestStatus] = useState(null);',
    'const [joinRequestStatus, setJoinRequestStatus] = useState(null);\n  const [typingUsers, setTypingUsers] = useState([]);'
  );
}

// 2. Add typing channel ref
if (!content.includes('typingChannelRef')) {
  content = content.replace(
    'const [isAddingMember, setIsAddingMember] = useState(false);',
    'const [isAddingMember, setIsAddingMember] = useState(false);\n  const typingChannelRef = React.useRef(null);'
  );
}

// 3. Add typing channel setup inside the loadPosts useEffect or after selectedCommunity changes
// Find where channels are set up and add typing channel
const oldChannelSetup = `          const channel = supabase.channel(\`community_posts_\${Date.now()}\`)`;
const newChannelSetup = `          // Typing indicator via Presence
          if (typingChannelRef.current) supabase.removeChannel(typingChannelRef.current);
          const typingChannel = supabase.channel(\`typing_\${communityId}_\${session.user.id}\`, {
            config: { presence: { key: session.user.id } }
          });
          typingChannel
            .on('presence', { event: 'sync' }, () => {
              const state = typingChannel.presenceState();
              const others = Object.entries(state)
                .filter(([uid]) => uid !== session.user.id)
                .map(([uid, [data]]) => data);
              setTypingUsers(others.filter(u => u?.isTyping));
            })
            .subscribe();
          typingChannelRef.current = typingChannel;

          const channel = supabase.channel(\`community_posts_\${Date.now()}\`)`;

content = content.replace(oldChannelSetup, newChannelSetup);

// 4. Broadcast typing=true when isUploading becomes true
const oldSetIsUploading = `    setIsUploading(true);

    try {`;
const newSetIsUploading = `    setIsUploading(true);
    if (typingChannelRef.current) {
      typingChannelRef.current.track({ isTyping: true, name: userProfile?.name || 'Someone', avatar_url: userProfile?.avatar_url || null });
    }

    try {`;
content = content.replace(oldSetIsUploading, newSetIsUploading);

// 5. Broadcast typing=false when done
const oldSetIsUploadingFalse = `    setIsUploading(false);
  };

  const loadMySubjects`;
const newSetIsUploadingFalse = `    setIsUploading(false);
    if (typingChannelRef.current) {
      typingChannelRef.current.track({ isTyping: false });
    }
  };

  const loadMySubjects`;
content = content.replace(oldSetIsUploadingFalse, newSetIsUploadingFalse);

// 6. Add typing bubble JSX before the posts grid closes - after the posts.map
const oldPostsEnd = `                ) : (
                    posts.map(post => {`;
const newPostsEnd = `                ) : (
                    <>
                      {posts.map(post => {`;

content = content.replace(oldPostsEnd, newPostsEnd);

// Close the extra wrapper after posts.map
// Find the end of posts.map and add typing bubble + close the fragment
const oldPostsMapClose = `                  )}
                </div>

                {/* Post Button */}`;
const newPostsMapClose = `                      {/* Typing indicator bubble */}
                      {typingUsers.length > 0 && typingUsers.map((u, i) => (
                        <div key={i} className="flex items-end gap-2 col-span-full pt-2 pb-1">
                          <div className="w-9 h-9 rounded-full bg-primary/10 overflow-hidden shrink-0 border-2 border-surface shadow">
                            {u.avatar_url
                              ? <img src={u.avatar_url} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-primary text-xs font-bold">{(u.name || '?')[0].toUpperCase()}</div>}
                          </div>
                          <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-bl-sm bg-surface border border-primary/20 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                {/* Post Button */}`;
content = content.replace(oldPostsMapClose, newPostsMapClose);

fs.writeFileSync('src/screens/Explore.jsx', content);
console.log('Patched typing indicator');
