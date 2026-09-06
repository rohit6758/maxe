const fs = require('fs');

let content = fs.readFileSync('src/screens/Profile.jsx', 'utf8');

const replacement = `    const { error } = await supabase
      .from('profiles')
      .update({
        name: name.trim(),
        username: username.trim().toLowerCase(),
        bio: bio.trim(),
        branch,
        college,
        avatar_url: avatarUrl
      })
      .eq('id', session.user.id);

    if (error) {
      if (error.code === '23505' || error.message.includes('duplicate')) {
        alert('This username is already taken. Please choose another one.');
      } else {
        alert('Save failed: ' + error.message);
      }
    } else {
      // Manually update the context
      setUserProfile({
        ...userProfile,
        name: name.trim(),
        username: username.trim().toLowerCase(),
        bio: bio.trim(),
        branch,
        college,
        avatar_url: avatarUrl
      });
      setSaved(true);
      setTimeout(() => { setSaved(false); setIsEditing(false); }, 1000);
    }`;

const startStr = 'const { data, error } = await supabase';
const startIdx = content.indexOf(startStr);
const endStr = 'setTimeout(() => { setSaved(false); setIsEditing(false); }, 1000);\n    }';
const endStr2 = 'setTimeout(() => { setSaved(false); setIsEditing(false); }, 1000);\r\n    }';

let endIdx = content.indexOf(endStr, startIdx);
let finalEndStr = endStr;
if (endIdx === -1) {
    endIdx = content.indexOf(endStr2, startIdx);
    finalEndStr = endStr2;
}

if (startIdx !== -1 && endIdx !== -1) {
    content = content.substring(0, startIdx) + replacement + content.substring(endIdx + finalEndStr.length);
    fs.writeFileSync('src/screens/Profile.jsx', content);
    console.log('Success Profile Save');
} else {
    console.log('Failed Profile Save', startIdx, endIdx);
}
