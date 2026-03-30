import { useRef, useState } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { apiFetch, getProfilePicUrl } from '../lib/api';
import { toast } from 'sonner';

interface ProfilePicUploadProps {
  currentPic: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  onUpdate?: (newPic: string | null) => void;
}

export function ProfilePicUpload({
  currentPic,
  name,
  size = 'lg',
  onUpdate,
}: ProfilePicUploadProps) {
  const [pic, setPic]             = useState<string | null>(currentPic);
  const [uploading, setUploading] = useState(false);
  const [imgFailed, setImgFailed] = useState(false); // 👈 Tracks broken images
  const fileInputRef              = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'size-12 text-sm',
    md: 'size-16 text-base',
    lg: 'size-24 text-xl',
  };

  const iconSizes = {
    sm: 'size-4',
    md: 'size-5',
    lg: 'size-8',
  };

  const getInitials = (n: string) =>
    n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast.error('Only JPG, PNG, or WEBP images allowed');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB');
      return;
    }

    setUploading(true);
    try {
      const token    = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('profilePic', file); // 👈 Must match backend precisely

      // Determine backend URL (fallback to localhost:5000 if env variable is missing)
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      const res = await fetch(`${API_URL}/profile-pic`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}` 
          // ❌ DO NOT put 'Content-Type' here!
        },
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();

      setPic(data.profilePic);
      setImgFailed(false); // 👈 Reset broken image state on successful upload
      onUpdate?.(data.profilePic);
      toast.success('Profile picture updated!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    setUploading(true);
    try {
      await apiFetch('/profile-pic', { method: 'DELETE' });
      setPic(null);
      setImgFailed(false); // Reset broken state
      onUpdate?.(null);
      toast.success('Profile picture removed');
    } catch {
      toast.error('Failed to remove picture');
    } finally {
      setUploading(false);
    }
  };

  const picUrl = getProfilePicUrl(pic);

  return (
    <div className="relative inline-block">
      {/* Avatar circle */}
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shrink-0 border-2 border-border`}>
        {picUrl && !imgFailed ? (
          <img
            src={picUrl}
            alt={name}
            className="w-full h-full object-cover"
            onError={() => setImgFailed(true)} // 👈 Switches to initials if image breaks
          />
        ) : (
          <span className={`font-bold text-primary ${iconSizes[size]}`}>
            {getInitials(name)}
          </span>
        )}

        {/* Uploading overlay */}
        {uploading && (
          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
            <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Camera button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="absolute bottom-0 right-0 size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 border-background hover:bg-primary/90 transition-colors disabled:opacity-50"
        title="Change photo"
      >
        <Camera className="size-3.5" />
      </button>

      {/* Remove button — only if pic exists */}
      {pic && (
        <button
          onClick={handleRemove}
          disabled={uploading}
          className="absolute -top-1 -right-1 size-5 rounded-full bg-destructive text-white flex items-center justify-center border border-background hover:bg-destructive/90 transition-colors disabled:opacity-50"
          title="Remove photo"
        >
          <Trash2 className="size-2.5" />
        </button>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleUpload}
      />
    </div>
  );
}