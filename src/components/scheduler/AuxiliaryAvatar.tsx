
import React from 'react';

interface AuxiliaryAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

const AuxiliaryAvatar: React.FC<AuxiliaryAvatarProps> = ({ name, size = 'sm' }) => {
  const getInitials = (fullName: string) => {
    const names = fullName.trim().split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  };

  return (
    <div className={`${sizeClasses[size]} bg-tranches-sage text-white rounded-full flex items-center justify-center font-medium`}>
      {getInitials(name)}
    </div>
  );
};

export default AuxiliaryAvatar;
