"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/navbar";

export default function CreateProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    profilePicture: "",
    resumeUrl: "",
  });
  const [previewImage, setPreviewImage] = useState<string>("");
  const [previewResume, setPreviewResume] = useState<string>("");

  // Helper function to crop and compress image to 9:16 aspect ratio
  const cropImageToAspectRatio = (file: File, aspectRatio: number = 9/16): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          // Calculate dimensions for 9:16 aspect ratio (portrait)
          let sourceWidth = img.width;
          let sourceHeight = img.height;
          let sourceX = 0;
          let sourceY = 0;

          const imgAspectRatio = img.width / img.height;

          if (imgAspectRatio > aspectRatio) {
            // Image is too wide, crop sides
            sourceWidth = img.height * aspectRatio;
            sourceX = (img.width - sourceWidth) / 2;
          } else {
            // Image is too tall, crop top/bottom
            sourceHeight = img.width / aspectRatio;
            sourceY = (img.height - sourceHeight) / 2;
          }

          // Set canvas to reasonable size (max 1080px width for 9:16)
          const maxWidth = 1080;
          canvas.width = maxWidth;
          canvas.height = maxWidth / aspectRatio;

          // Draw cropped and scaled image
          ctx.drawImage(
            img,
            sourceX, sourceY, sourceWidth, sourceHeight,
            0, 0, canvas.width, canvas.height
          );

          // Convert to base64 with compression
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const croppedImage = await cropImageToAspectRatio(file, 9/16);
        setFormData({ ...formData, profilePicture: croppedImage });
        setPreviewImage(croppedImage);
      } catch (error) {
        console.error('Error cropping image:', error);
        alert('Failed to process image');
      }
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Only accept images
      if (!file.type.startsWith('image/')) {
        alert('Please upload a screenshot of your resume (PNG, JPG, etc.)');
        e.target.value = '';
        return;
      }

      // Crop image resumes to 8.5:11 aspect ratio (letter size)
      try {
        const croppedImage = await cropImageToAspectRatio(file, 8.5/11);
        setFormData({ ...formData, resumeUrl: croppedImage });
        setPreviewResume(croppedImage);
      } catch (error) {
        console.error('Error cropping resume:', error);
        alert('Failed to process resume image');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Log data sizes
    console.log('Form data sizes:', {
      name: formData.name,
      profilePictureSize: formData.profilePicture.length,
      resumeUrlSize: formData.resumeUrl.length,
    });

    try {
      const response = await fetch("/api/profile/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        // Refresh the session to update hasProfile flag
        await update();
        router.push('/');
      } else {
        const errorData = await response.json();
        console.error("Failed to create profile:", errorData);
        alert(`Failed to create profile: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error creating profile:", error);
      alert("Error creating profile. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    return null;
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen py-4 sm:py-12 dot-grid">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-light">Create Your Profile</CardTitle>
              <CardDescription className="font-light">
                Upload your photo and resume so others can predict your next co-op salary
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Full Name */}
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-light text-muted-foreground">
                    Full Name
                  </label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    className="font-light"
                  />
                </div>

                {/* Face Photo */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-light text-muted-foreground">
                      Face Photo
                    </label>
                    <label htmlFor="photo-upload">
                      <span className="px-4 py-2 text-xs font-light border border-border rounded-md hover:bg-muted transition-colors cursor-pointer">
                        {previewImage ? "Choose new photo" : "Upload photo"}
                      </span>
                    </label>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                  {previewImage && (
                    <div className="flex justify-center">
                      <img
                        src={previewImage}
                        alt="Profile preview"
                        className="w-full max-w-md object-cover border-2 border-border rounded-lg"
                      />
                    </div>
                  )}
                </div>

                {/* Resume */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-light text-muted-foreground">
                        Resume Screenshot
                      </label>
                      <label htmlFor="resume-upload">
                        <span className="px-4 py-2 text-xs font-light border border-border rounded-md hover:bg-muted transition-colors cursor-pointer">
                          {previewResume ? "Change" : "Upload"}
                        </span>
                      </label>
                      <input
                        id="resume-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleResumeUpload}
                        className="hidden"
                      />
                    </div>
                    <p className="text-xs font-light text-muted-foreground/60">
                      Screenshot your resume for best mobile viewing
                    </p>
                  </div>
                  {previewResume && (
                    <div className="flex justify-center">
                      <img
                        src={previewResume}
                        alt="Resume preview"
                        className="w-full object-contain border-2 border-border rounded-lg"
                      />
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <Button type="submit" className="w-full font-light" disabled={isLoading}>
                    {isLoading ? "Creating..." : "Create Profile"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
