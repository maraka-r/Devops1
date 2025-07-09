'use client';

import React, { useState, useRef } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X } from 'lucide-react';

interface AvatarUploadProps {
  currentAvatar?: string;
  userName?: string;
  onUploadSuccess?: (avatarUrl: string) => void;
  onUploadError?: (error: string) => void;
}

export function AvatarUpload({ 
  currentAvatar, 
  userName,
  onUploadSuccess,
  onUploadError 
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation et upload du fichier
  const handleFileSelect = async (file: File) => {
    // Validation du type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      const error = 'Type de fichier non supporté. Utilisez JPEG, PNG ou WebP.';
      alert(error);
      onUploadError?.(error);
      return;
    }

    // Validation de la taille (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      const error = 'Fichier trop volumineux. Taille maximum: 5MB';
      alert(error);
      onUploadError?.(error);
      return;
    }

    // Créer preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload vers l'API
    await uploadAvatar(file);
  };

  // Upload du fichier vers l'API
  const uploadAvatar = async (file: File) => {
    try {
      setIsLoading(true);

      const formData = new FormData();
      formData.append('avatar', file);

      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/users/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert("Avatar mis à jour avec succès");
        setPreview(null);
        onUploadSuccess?.(data.avatarUrl);
      } else {
        throw new Error(data.error || 'Erreur lors de l\'upload');
      }
    } catch (error) {
      console.error('Erreur upload avatar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'upload';
      alert(errorMessage);
      onUploadError?.(errorMessage);
      setPreview(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Supprimer l'avatar
  const removeAvatar = async () => {
    try {
      setIsLoading(true);

      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/users/avatar', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert("Avatar supprimé avec succès");
        setPreview(null);
        onUploadSuccess?.('');
      } else {
        throw new Error(data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression avatar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la suppression';
      alert(errorMessage);
      onUploadError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Gestion du drag & drop
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Initiales de l'utilisateur
  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'U';

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Avatar actuel */}
      <div className="relative">
        <Avatar className="w-24 h-24">
          <AvatarImage src={preview || currentAvatar} alt={userName || 'Avatar'} />
          <AvatarFallback className="text-lg font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        
        {/* Boutons de contrôle */}
        <div className="absolute -bottom-2 -right-2 flex gap-1">
          <Button
            size="sm"
            variant="outline"
            className="rounded-full p-1 h-8 w-8"
            onClick={handleClick}
            disabled={isLoading}
          >
            <Camera className="w-3 h-3" />
          </Button>
          
          {(currentAvatar || preview) && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-full p-1 h-8 w-8 bg-red-50 hover:bg-red-100 text-red-600"
              onClick={removeAvatar}
              disabled={isLoading}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Zone de drag & drop */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
          ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 mb-1">
          Glissez une image ici ou cliquez pour sélectionner
        </p>
        <p className="text-xs text-gray-500">
          JPG, PNG, WebP jusqu&apos;à 5MB
        </p>
      </div>

      {/* Input file caché */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
        disabled={isLoading}
      />

      {/* Bouton de téléchargement alternatif */}
      <Button
        variant="outline"
        onClick={handleClick}
        disabled={isLoading}
        className="w-full max-w-xs"
      >
        <Upload className="w-4 h-4 mr-2" />
        {isLoading ? 'Téléchargement...' : 'Choisir une photo'}
      </Button>
    </div>
  );
}

export default AvatarUpload;
