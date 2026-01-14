import React, { useEffect, useState } from "react";
import { CompanyProfile } from "../../types";
import { getEmployerProfile, updateEmployerProfile } from "../../services/employerService";

const EmployerPage: React.FC = () => {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<Partial<CompanyProfile>>({});

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getEmployerProfile();
        if (res.success && res.data) {
          setProfile(res.data);
          setForm(res.data);
        } else {
          setError(res.message || "Failed to load profile");
        }
      } catch (err) {
        setError("Error loading profile");
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await updateEmployerProfile(form);
      if (res.success && res.data) {
        setProfile(res.data);
        setEditMode(false);
      } else {
        setError(res.message || "Failed to update profile");
      }
    } catch (err) {
      setError("Error updating profile");
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Employer Profile</h1>
        <p>Loading employer data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Employer Profile</h1>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Employer Profile</h1>
      {editMode ? (
        <div className="space-y-4">
          <input
            type="text"
            name="companyName"
            value={form.companyName || ""}
            onChange={handleChange}
            placeholder="Company Name"
            className="border p-2 w-full"
          />
          <input
            type="text"
            name="website"
            value={form.website || ""}
            onChange={handleChange}
            placeholder="Website"
            className="border p-2 w-full"
          />
          <textarea
            name="description"
            value={form.description || ""}
            onChange={handleChange}
            placeholder="Description"
            className="border p-2 w-full"
          />
          <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleSave}>
            Save
          </button>
          <button className="bg-gray-300 px-4 py-2 rounded ml-2" onClick={() => setEditMode(false)}>
            Cancel
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div><strong>Company Name:</strong> {profile?.companyName}</div>
          <div><strong>Website:</strong> {profile?.website}</div>
          <div><strong>Description:</strong> {profile?.description}</div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded mt-4" onClick={() => setEditMode(true)}>
            Edit Profile
          </button>
        </div>
      )}
    </div>
  );
};

export default EmployerPage;
