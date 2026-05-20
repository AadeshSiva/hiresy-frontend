// App.jsx
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

// Pages
import Landing from "./Pages/Landing"
import Login from "./Pages/Auth/Login"
import HRDashboard from './Pages/HR/Dashboard'

// Dashboard Sub Pages
import AllPosts from './Pages/HR/AllPosts.jsx'
import AddPost from './Pages/HR/AddPost.jsx'
import Settings from './Pages/HR/Settings.jsx'
import Profile from './Pages/HR/Profile.jsx'

import JobPost from './Pages/Candidate/JobPost.jsx'
import JobApplication from './Pages/Candidate/JobApplication.jsx'

import CodingTest from "./Codingtest/Codingtest.jsx";

import TestPage from "./Shortlistingtest/Testpage.jsx";
import VerbalTest from "./Communicationtest/VerbalTest.jsx";
import SpokenTest from "./Communicationtest/SpokenTest.jsx";

import Live from './LiveMeet/Live.jsx'
import Back from './Backgroundverification/Background.jsx'
import Offer from './Offerletter/Offer.jsx'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/back" element={<Back />} />
        <Route path="/job/:id" element={<JobPost />} />
        <Route path="/job/:id/apply" element={<JobApplication />} />

        <Route path="/test/:token" element={<TestPage />} />

        <Route path="/verbal-test/:token" element={<VerbalTest />} />

        <Route path="/spoken-test/:token" element={<SpokenTest />} />

        <Route path="/coding/:token" element={<CodingTest />} />

        <Route path="/livehr/:token" element={<Live />} />

        <Route path="/live" element={<Live />} />

        <Route path="/back/:token" element={<Back />} />
        <Route path="/back-test" element={<Back />} />
        <Route path="/offer/:token" element={<Offer />} />

        <Route path="/hrdashboard" element={<HRDashboard />}>
          <Route index element={<AllPosts />} />
          <Route path="all" element={<AllPosts />} />
          <Route path="add" element={<AddPost />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </Router>
  )
}