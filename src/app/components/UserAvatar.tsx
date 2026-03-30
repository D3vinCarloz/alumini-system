import { useState } from 'react';
import { getProfilePicUrl } from '../lib/api';

interface UserAvatarProps {
  profilePic?: string | null;
  name: string;
  className?: string; // Used to control size, e.g., "size-10 text-sm"
}

export function UserAvatar({ profilePic, name, className = "size-10 text-sm" }: UserAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const picUrl = getProfilePicUrl(profilePic);

  const getInitials = (n: string) => {
    if (!n) return '??';
    return n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div className={`rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shrink-0 border border-border ${className}`}>
      {picUrl && !imgFailed ? (
        <img
          src={picUrl}
          alt={name}
          className="w-full h-full object-cover bg-background"
          onError={() => {
            // 🚨 Diagnostic Log: If the image breaks, this will print the exact URL it tried to load!
            console.error(`🚨 Image failed to load for ${name}. URL tried:`, picUrl);
            setImgFailed(true);
          }}
        />
      ) : (
        <span className="font-semibold text-primary">
          {getInitials(name)}
        </span>
      )}
    </div>
  );
}