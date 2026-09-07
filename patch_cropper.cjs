const fs = require('fs');
let content = fs.readFileSync('src/screens/Explore.jsx', 'utf8');

// Add import
if (!content.includes('import ImageCropper')) {
  content = content.replace(
    'import { Users, Search, Plus, Trash2, FileText, Download, CheckCircle, Upload, MessageCircle, X, ArrowLeft, MoreVertical, Lock, LayoutGrid, Layers, Edit2, UserPlus, Image as ImageIcon } from \'lucide-react\';',
    'import { Users, Search, Plus, Trash2, FileText, Download, CheckCircle, Upload, MessageCircle, X, ArrowLeft, MoreVertical, Lock, LayoutGrid, Layers, Edit2, UserPlus, Image as ImageIcon } from \'lucide-react\';\nimport ImageCropper from \'../components/ImageCropper\';'
  );
}

// Add state
if (!content.includes('const [cropImageSrc, setCropImageSrc] = useState(null);')) {
  content = content.replace(
    'const [isSavingInfo, setIsSavingInfo] = useState(false);',
    'const [isSavingInfo, setIsSavingInfo] = useState(false);\n  const [cropImageSrc, setCropImageSrc] = useState(null);'
  );
}

// Replace handleUpdateGroupAvatar
const oldFunc = `  const handleUpdateGroupAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsSavingInfo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = \`avatar_\${selectedCommunity.id}_\${Math.random()}.\${fileExt}\`;
      const { error: uploadError } = await supabase.storage.from('uploads').upload(\`community_avatars/\${fileName}\`, file);
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(\`community_avatars/\${fileName}\`);
      const { data, error } = await supabase.from('communities').update({ avatar_url: publicUrl }).eq('id', selectedCommunity.id).select().single();
      if (error) throw error;
      
      setCommunities(communities.map(c => c.id === selectedCommunity.id ? data : c));
      setSelectedCommunity(data);
    } catch(err) { alert(err.message); }
    setIsSavingInfo(false);
  };`;

const newFunc = `  const handleSelectGroupAvatar = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener('load', () => setCropImageSrc(reader.result));
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  const handleUpdateGroupAvatar = async (file) => {
    setCropImageSrc(null);
    if (!file) return;
    setIsSavingInfo(true);
    try {
      const fileName = \`avatar_\${selectedCommunity.id}_\${Math.random()}.jpg\`;
      const { error: uploadError } = await supabase.storage.from('uploads').upload(\`community_avatars/\${fileName}\`, file, { contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(\`community_avatars/\${fileName}\`);
      const { data, error } = await supabase.from('communities').update({ avatar_url: publicUrl }).eq('id', selectedCommunity.id).select().single();
      if (error) throw error;
      
      setCommunities(communities.map(c => c.id === selectedCommunity.id ? data : c));
      setSelectedCommunity(data);
    } catch(err) { alert(err.message); }
    setIsSavingInfo(false);
  };`;

// Try both LF and CRLF line endings
content = content.replace(oldFunc, newFunc);
content = content.replace(oldFunc.replace(/\n/g, '\r\n'), newFunc);

// Replace onChange handler
content = content.replace(
  'onChange={handleUpdateGroupAvatar}',
  'onChange={handleSelectGroupAvatar}'
);

// Add Cropper component at the bottom of return
content = content.replace(
  '    </div>\n  );\n}',
  `      {cropImageSrc && (
        <ImageCropper
          imageSrc={cropImageSrc}
          aspectRatio={1}
          onCropComplete={handleUpdateGroupAvatar}
          onCancel={() => setCropImageSrc(null)}
        />
      )}
    </div>
  );
}`
);
content = content.replace(
  '    </div>\r\n  );\r\n}',
  `      {cropImageSrc && (
        <ImageCropper
          imageSrc={cropImageSrc}
          aspectRatio={1}
          onCropComplete={handleUpdateGroupAvatar}
          onCancel={() => setCropImageSrc(null)}
        />
      )}
    </div>
  );
}`
);

fs.writeFileSync('src/screens/Explore.jsx', content);
console.log('Patched Explore.jsx with Cropper');
