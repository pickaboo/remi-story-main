import React, { useState } from 'react';

interface ProfileNameEditorProps {
  currentName: string;
  onSave: (newName: string) => void;
}

export const ProfileNameEditor: React.FC<ProfileNameEditorProps> = ({ currentName, onSave }) => {
  const [name, setName] = useState(currentName);
  const [editing, setEditing] = useState(false);

  const handleSave = () => {
    onSave(name);
    setEditing(false);
  };

  return (
    <div>
      {editing ? (
        <>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="border rounded px-2 py-1"
          />
          <button onClick={handleSave} className="ml-2 text-primary">Spara</button>
          <button onClick={() => setEditing(false)} className="ml-1 text-muted">Avbryt</button>
        </>
      ) : (
        <>
          <span className="font-medium">{name}</span>
          <button onClick={() => setEditing(true)} className="ml-2 text-primary">Ändra</button>
        </>
      )}
    </div>
  );
}; 