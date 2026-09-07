const fs = require('fs');
let exploreContent = fs.readFileSync('src/screens/Explore.jsx', 'utf8');

const targetStr = `  useEffect(() => {
    if (selectedCommunity && !isCurrentMember) {
      const checkRequest = async () => {
        try {
          const { data, error } = await supabase.from('community_requests').select('status').match({ community_id: selectedCommunity.id, user_id: session.user.id }).order('created_at', { ascending: false }).limit(1).maybeSingle();
          if (data) setJoinRequestStatus(data.status);
          else setJoinRequestStatus(null);
        } catch (err) {}
      };
      checkRequest();
    }
  }, [selectedCommunity, isCurrentMember]);`;

const replacementStr = `  useEffect(() => {
    if (selectedCommunity && !isCurrentMember) {
      const checkRequest = async () => {
        try {
          const { data, error } = await supabase.from('community_requests').select('status').match({ community_id: selectedCommunity.id, user_id: session.user.id }).order('created_at', { ascending: false }).limit(1).maybeSingle();
          if (data) setJoinRequestStatus(data.status);
          else setJoinRequestStatus(null);
        } catch (err) {}
      };
      checkRequest();

      const channel = supabase.channel('user_request_status')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'community_requests', filter: \`community_id=eq.\${selectedCommunity.id}\` }, payload => {
           if (payload.new.user_id === session?.user?.id) {
             setJoinRequestStatus(payload.new.status);
             if (payload.new.status === 'accepted') {
                toast("Your join request was accepted!");
                setMyMemberships(prev => ({ ...prev, [selectedCommunity.id]: 'member' }));
             } else if (payload.new.status === 'rejected') {
                toast("Your join request was declined.", "error");
             }
           }
        }).subscribe();
        
      return () => { supabase.removeChannel(channel); };
    }
  }, [selectedCommunity, isCurrentMember]);`;

exploreContent = exploreContent.replace(targetStr, replacementStr);
fs.writeFileSync('src/screens/Explore.jsx', exploreContent);
