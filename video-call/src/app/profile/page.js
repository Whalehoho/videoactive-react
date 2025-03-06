"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchUser, updateUser, uploadImage } from "../services/api";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState(true); // Boolean: true = Male, false = Female
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null); // Local preview
  const [imageFile, setImageFile] = useState(null); // File to send
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchUser().then((info) => {
      console.log(info)
      if (!info) {
        router.push("/auth");
      } else {
        console.log("fetch data:" + info.message )
        setUser(info.user);
        setEmail(info.user.email);
        setName(info.user.username || "");
        setGender(info.user.gender ?? true);
        setDescription(info.user.description || "");
        setImage(info.user.profilePic || null);
      }
      setLoading(false);
    });
  }, []);
  // Handle image selection
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageURL = URL.createObjectURL(file);
      setImage(imageURL); // Show preview
      setImageFile(file); // Store file for upload
    }
  };

  // ✅ Handle user profile update
  const handleUpdateUser = async () => {
    setUpdating(true);
  
    if (
      name === user.name &&
      gender === user.gender &&
      description === user.description &&
      !imageFile
    ) {
      alert("No changes detected.");
      setUpdating(false);
      return;
    }
  
    let imageUrl = user.image;
  
    if (imageFile) {
      const uploadResponse = await uploadImage(imageFile);
      if (uploadResponse?.imageUrl) {
        imageUrl = uploadResponse.imageUrl;
        setImage(imageUrl); // ✅ refresh to prevent cache data
      } else {
        alert("Failed to upload image.");
        setUpdating(false);
        return;
      }
    }
  
    const response = await updateUser({ name, gender, description, image: imageUrl });

    if (response?.message === "success" && response.user) {
      alert("Profile updated successfully!");
      setUser(response.user); // ✅ Update user directly from response
      setName(response.user.name || "");
      setGender(response.user.gender ?? true); 
      setDescription(response.user.description || "");
      setImage(response.user.image || null);
    } else {
      alert("Failed to update profile.");
    }

    setUpdating(false);
  };
  
  

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow flex flex-col items-center justify-center px-10 py-10">
        <div className="bg-white shadow-lg rounded-lg p-6 flex gap-8 w-full max-w-3xl py-10 my-10">
          {/* Profile Image Box */}
          <div className="w-40 h-40 bg-gray-300 flex items-center justify-center rounded-lg overflow-hidden relative">
            {image ? (
              <img src={image} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-500">No Image</span>
            )}
            {/* File Input for Image Upload */}
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleImageChange}
            />
          </div>

          <div className="flex flex-col gap-4 w-full">
            <h1 className="text-2xl font-semibold text-gray-800">Profile</h1>
            <div>
              <label className="text-gray-600 font-medium">Name:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 text-gray-900 rounded-lg px-3 py-2 mt-1"
              />
            </div>

            <div>
              <label className="text-gray-600 font-medium">Email:</label>
              <input
                type="email"
                value={user.email}
                readOnly
                className="w-full border border-gray-300 rounded-lg text-gray-900 px-3 py-2 mt-1 bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-gray-600 font-medium">Gender:</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value === "true")} // Convert string to boolean
                className="w-full border border-gray-300 text-gray-900 rounded-lg px-3 py-2 mt-1"
              >
                <option value={true}>Male</option>
                <option value={false}>Female</option>
              </select>
            </div>

            <div>
              <label className="text-gray-600 font-medium">Description:</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-300 text-gray-900 rounded-lg px-3 py-2 mt-1"
                rows="3"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-between mt-4">
              {/* Save Changes Button */}
              <button
                onClick={handleUpdateUser}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                disabled={updating}
              >
                {updating ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
