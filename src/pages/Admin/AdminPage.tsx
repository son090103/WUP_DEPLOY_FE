import { Globe, Github, Twitter, Instagram, Facebook } from "lucide-react";

const UserProfile = () => {
  const userData = {
    name: "Kenneth Valdez",
    title: "Full Stack Developer",
    location: "Bay Area, San Francisco, CA",
    email: "fip@ijkmuh.al",
    phone: "(239) 816-9029",
    mobile: "(320) 389-4539",
    address: "Bay Area, San Francisco, CA",
    website: "https://bootdey.com",
    social: {
      github: "bootdey",
      twitter: "@bootdey",
      instagram: "bootdey",
      facebook: "bootdey"
    }
  };

  const projects = [
    { name: "Web Design", progress: 85 },
    { name: "Website Markup", progress: 72 },
    { name: "One Page", progress: 89 },
    { name: "Mobile Template", progress: 55 },
    { name: "Backend API", progress: 66 }
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Breadcrumb */}
      <div className="mb-6">
        <nav className="text-sm">
          <span className="text-blue-500 hover:underline cursor-pointer">Home</span>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-blue-500 hover:underline cursor-pointer">User</span>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-600">User Profile</span>
        </nav>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Info */}
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="mb-4">
              <img
                src="https://ui-avatars.com/api/?name=John+Doe&size=150&background=4F46E5&color=fff&bold=true"
                alt="Profile"
                className="w-32 h-32 rounded-full mx-auto border-4 border-gray-100"
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">John Doe</h2>
            <p className="text-gray-600 mb-1">{userData.title}</p>
            <p className="text-sm text-gray-500 mb-4">{userData.location}</p>
            <div className="flex gap-3 justify-center">
              <button className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                Follow
              </button>
              <button className="px-6 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors">
                Message
              </button>
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700 font-medium">Website</span>
                </div>
                <span className="text-gray-500 text-sm">{userData.website}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <Github className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700 font-medium">Github</span>
                </div>
                <span className="text-gray-500 text-sm">{userData.social.github}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <Twitter className="w-5 h-5 text-blue-400" />
                  <span className="text-gray-700 font-medium">Twitter</span>
                </div>
                <span className="text-gray-500 text-sm">{userData.social.twitter}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <Instagram className="w-5 h-5 text-pink-500" />
                  <span className="text-gray-700 font-medium">Instagram</span>
                </div>
                <span className="text-gray-500 text-sm">{userData.social.instagram}</span>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Facebook className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-700 font-medium">Facebook</span>
                </div>
                <span className="text-gray-500 text-sm">{userData.social.facebook}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Details & Projects */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
              <div className="py-3 border-b border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Full Name</p>
                <p className="text-gray-800 font-medium">{userData.name}</p>
              </div>

              <div className="py-3 border-b border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Email</p>
                <p className="text-gray-800 font-medium">{userData.email}</p>
              </div>

              <div className="py-3 border-b border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Phone</p>
                <p className="text-gray-800 font-medium">{userData.phone}</p>
              </div>

              <div className="py-3 border-b border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Mobile</p>
                <p className="text-gray-800 font-medium">{userData.mobile}</p>
              </div>

              <div className="py-3 md:col-span-2">
                <p className="text-sm text-gray-500 mb-1">Address</p>
                <p className="text-gray-800 font-medium">{userData.address}</p>
              </div>
            </div>
          </div>

          {/* Project Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Assignment 1 */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="mb-4">
                <span className="text-blue-500 text-sm font-medium">assignment</span>
                <span className="text-gray-800 font-semibold ml-2">Project Status</span>
              </div>
              <div className="space-y-4">
                {projects.map((project, index) => (
                  <div key={index}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-700">{project.name}</span>
                      <span className="text-sm text-gray-500">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Assignment 2 (Duplicate for demo) */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="mb-4">
                <span className="text-blue-500 text-sm font-medium">assignment</span>
                <span className="text-gray-800 font-semibold ml-2">Project Status</span>
              </div>
              <div className="space-y-4">
                {projects.map((project, index) => (
                  <div key={index}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-700">{project.name}</span>
                      <span className="text-sm text-gray-500">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;