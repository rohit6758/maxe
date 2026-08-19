import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import Aggregator from './screens/Aggregator';
import PostMortemLog from './screens/PostMortemLog';
import ExamProgression from './screens/ExamProgression';
import QuickScan from './screens/QuickScan';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Aggregator />} />
          <Route path="logs" element={<PostMortemLog />} />
          <Route path="timeline" element={<ExamProgression />} />
          <Route path="scan" element={<QuickScan />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
