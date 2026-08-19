import React from 'react';
import { PlayCircle, FileText, MessageSquare, History, Plus } from 'lucide-react';

export default function Aggregator() {
  return (
    <div className="p-4 space-y-6 pb-20 relative">
      
      {/* Header Section */}
      <div className="text-center space-y-2 mt-2">
        <div className="inline-block px-3 py-1 bg-surface border border-[#333] rounded-full text-xs font-semibold text-body mb-2">
          ★ Mid 2 Preparation
        </div>
        <h2 className="text-3xl font-bold text-header text-aberration">Data Structures</h2>
        <p className="text-sm text-body px-4 leading-relaxed">
          Central resource hub for arrays, linked lists, trees, and graphs.
        </p>
      </div>

      {/* Component 1: YouTube Videos */}
      <section>
        <SectionHeader icon={<PlayCircle size={16} />} title="YouTube Videos" />
        <div className="space-y-3">
          <VideoCard 
            title="Red-Black Trees Explained Visually" 
            channel="Computer Science Prep" 
            thumbnail="bg-gradient-to-br from-[#1a2a22] to-[#0d1411]" 
          />
          <VideoCard 
            title="Graph Traversal Algorithms: BFS & DFS" 
            channel="Algo Expert Lectures" 
            thumbnail="bg-gradient-to-br from-[#141a22] to-[#0a0d11]" 
          />
        </div>
      </section>

      {/* Component 2: PDF Notes */}
      <section>
        <SectionHeader icon={<FileText size={16} />} title="PDF Notes" />
        <div className="space-y-2">
          <PdfCard title="Midterm 2 Cheat Sheet" size="2.5 MB" time="Added yesterday" />
          <PdfCard title="Prof. Smith's Hash Table Notes" size="5.1 MB" time="3 days ago" />
        </div>
      </section>

      {/* Component 3: AI Chat History */}
      <section>
        <div className="bg-surface rounded-xl border border-[#333] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-[#333]">
            <div className="flex items-center gap-2 text-header font-semibold">
              <MessageSquare size={18} />
              <h3>AI Chat History</h3>
            </div>
            <div className="p-1 rounded bg-[#181A18]">
               <MessageSquare size={14} className="text-body" />
            </div>
          </div>
          <div className="p-4 space-y-4">
            <ChatQuery 
              text='"Explain the time complexity of a Heap Sort versus Quick Sort in worst-case scenarios."' 
              time="2 hours ago" 
            />
            <ChatQuery 
              text='"How do you resolve collisions in hash maps using separate chaining?"' 
              time="Yesterday" 
            />
            <ChatQuery 
              text='"Can you generate a practice problem for reversing a linked list?"' 
              time="Oct 12" 
            />
          </div>
          <button className="w-full py-3 bg-[#1e211e] text-body text-sm font-medium hover:text-header transition-colors border-t border-[#333]">
            View All Queries
          </button>
        </div>
      </section>

      {/* Component 4: Recent Activity */}
      <section>
        <div className="bg-surface rounded-xl border border-[#333] p-4">
          <div className="flex items-center gap-2 text-header font-semibold mb-4">
            <History size={18} />
            <h3>Recent Activity</h3>
          </div>
          <div className="relative pl-3 space-y-4 before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-[#333]">
            <ActivityItem text="Added new PDF: Graph Theory Basics" time="Just now" active />
            <ActivityItem text="Completed AI Practice: Binary Search" time="4 hrs ago" />
            <ActivityItem text="Saved YouTube link from CS50" time="1 day ago" />
          </div>
        </div>
      </section>

      {/* FAB */}
      <button className="fixed bottom-[88px] right-[calc(50%-180px)] w-14 h-14 bg-primary/20 backdrop-blur-md border border-primary rounded-full flex items-center justify-center text-primary shadow-lg hover:bg-primary/40 transition-colors z-10">
        <Plus size={28} />
      </button>

    </div>
  );
}

// Subcomponents
const SectionHeader = ({ icon, title }) => (
  <div className="flex items-center gap-2 text-body mb-3 px-1 border-b border-[#333] pb-1">
    {icon}
    <h3 className="text-sm font-semibold uppercase tracking-wider">{title}</h3>
  </div>
);

const VideoCard = ({ title, channel, thumbnail }) => (
  <div className="bg-surface rounded-xl overflow-hidden border border-[#333]">
    <div className={`h-32 w-full ${thumbnail} relative flex items-center justify-center`}>
       <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center border border-white/20 backdrop-blur-sm">
          <PlayCircle size={28} className="text-header" fill="rgba(255,255,255,0.1)" />
       </div>
    </div>
    <div className="p-3">
      <h4 className="text-header font-medium text-sm">{title}</h4>
      <p className="text-body text-xs mt-1">{channel}</p>
    </div>
  </div>
);

const PdfCard = ({ title, size, time }) => (
  <div className="bg-surface rounded-xl p-3 flex items-center gap-4 border border-[#333]">
    <div className="w-10 h-10 rounded bg-[#1e211e] flex items-center justify-center border border-[#333]">
      <FileText size={20} className="text-body" />
    </div>
    <div>
      <h4 className="text-header font-medium text-sm">{title}</h4>
      <p className="text-body text-xs mt-0.5">{size} • {time}</p>
    </div>
  </div>
);

const ChatQuery = ({ text, time }) => (
  <div className="space-y-1">
    <p className="text-header text-sm leading-relaxed">{text}</p>
    <p className="text-primary text-xs font-medium">{time}</p>
  </div>
);

const ActivityItem = ({ text, time, active }) => (
  <div className="relative pl-6">
    <div className={`absolute left-[-15px] top-1 w-4 h-4 rounded-full border-2 bg-surface flex items-center justify-center ${active ? 'border-primary' : 'border-[#444]'}`}>
       {active && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
    </div>
    <p className="text-header text-sm font-medium">{text}</p>
    <p className="text-body text-xs mt-0.5">{time}</p>
  </div>
);
