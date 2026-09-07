const fs = require('fs');
let content = fs.readFileSync('src/screens/Explore.jsx', 'utf8');

// remove from line 493
const toRemove = `  const isCurrentMember = selectedCommunity ? (myMemberships[selectedCommunity.id] || isAdmin) : false;
  const isCommunityAdmin = selectedCommunity ? (selectedCommunity.created_by === session?.user?.id || myMemberships[selectedCommunity.id] === 'admin' || isAdmin) : false;`;

content = content.replace(toRemove, '');
content = content.replace(toRemove.replace(/\r\n/g, '\n'), '');

// insert after communityRequests state
const targetStr = `const [communityRequests, setCommunityRequests] = useState([]);`;
const replacementStr = `const [communityRequests, setCommunityRequests] = useState([]);

  const isCurrentMember = selectedCommunity ? (myMemberships[selectedCommunity.id] || isAdmin) : false;
  const isCommunityAdmin = selectedCommunity ? (selectedCommunity.created_by === session?.user?.id || myMemberships[selectedCommunity.id] === 'admin' || isAdmin) : false;`;

content = content.replace(targetStr, replacementStr);

fs.writeFileSync('src/screens/Explore.jsx', content);
