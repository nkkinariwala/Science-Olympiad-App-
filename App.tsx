import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpenIcon, 
  CalendarIcon, 
  UsersIcon, 
  BrainCircuitIcon, 
  CheckCircleIcon,
  ChevronRightIcon,
  StarIcon,
  WandIcon,
  HomeIcon
} from './components/Icons';
import { Topic, User, QuizQuestion, WeekPlan, Tab, AnalogyType } from './types';
import * as GeminiService from './services/geminiService';

// --- Mock Data ---
const MOCK_USER: User = {
  id: 'u1',
  name: 'Alex',
  role: 'parent',
  xp: 1250,
  level: 3,
  streak: 5,
};

// Official 2026 Categories
const CATEGORIES = {
  LIFE: "Life, Personal & Social Science",
  EARTH: "Earth and Space Science",
  PHYSICAL: "Physical Science & Chemistry",
  TECH: "Technology & Engineering",
  INQUIRY: "Inquiry & Nature of Science"
};

const DIVISION_B_EVENTS_DATA = [
  { title: "Hovercraft", category: CATEGORIES.PHYSICAL }, // Or Tech/Eng depending on rules, keeping enabled
  { title: "Air Trajectory", category: CATEGORIES.PHYSICAL },
  { title: "Anatomy & Physiology", category: CATEGORIES.LIFE },
  { title: "Codebusters", category: CATEGORIES.INQUIRY },
  { title: "Crime Busters", category: CATEGORIES.PHYSICAL },
  { title: "Disease Detectives", category: CATEGORIES.LIFE },
  { title: "Dynamic Planet", category: CATEGORIES.EARTH },
  { title: "Ecology", category: CATEGORIES.LIFE },
  { title: "Experimental Design", category: CATEGORIES.INQUIRY },
  { title: "Fast Facts", category: CATEGORIES.INQUIRY },
  { title: "Food Science", category: CATEGORIES.PHYSICAL },
  { title: "Forestry", category: CATEGORIES.LIFE },
  { title: "Helicopter", category: CATEGORIES.TECH },
  { title: "Meteorology", category: CATEGORIES.EARTH },
  { title: "Microbe Mission", category: CATEGORIES.LIFE },
  { title: "Mission Possible", category: CATEGORIES.TECH },
  { title: "Optics", category: CATEGORIES.PHYSICAL },
  { title: "Reach for the Stars", category: CATEGORIES.EARTH },
  { title: "Road Scholar", category: CATEGORIES.EARTH },
  { title: "Scrambler", category: CATEGORIES.TECH },
  { title: "Towers", category: CATEGORIES.TECH },
  { title: "Wind Power", category: CATEGORIES.PHYSICAL },
  { title: "Write It Do It", category: CATEGORIES.INQUIRY }
];

const ENABLED_EVENTS = ["Hovercraft"];

const MOCK_TOPICS: Topic[] = DIVISION_B_EVENTS_DATA.map((event, idx) => ({
  id: `t${idx}`,
  title: event.title,
  category: event.category,
  difficulty: 'Intermediate',
  progress: event.title === 'Hovercraft' ? 45 : 0,
  description: `Master the rules and concepts for ${event.title}.`,
  baseSummary: `Official preparation materials for ${event.title}.`,
  concepts: event.title === 'Hovercraft' ? [
    "Newton's Laws of Motion (Inertia, F=ma)",
    "Kinematics (Velocity & Acceleration)",
    "Kinetic Energy & Momentum",
    "Fluid Mechanics (Flow & Viscosity)",
    "Fluid Dynamics (Bernoulli's Principle)",
    "Pressure (Force/Area)",
    "Skirt Designs & Geometries",
    "Propellers & Impulse",
    "Center of Gravity vs Pressure",
    "Electrical Units (Volts, Amps, Watts)",
    "Circuit Basics & Ohm's Law",
    "Battery Logic & Series/Parallel"
  ] : ["General Rules", "Scoring", "Key Concepts"]
}));

// --- Sub-Components ---

const BottomNav = ({ activeTab, onTabChange }: { activeTab: string, onTabChange: (t: any) => void }) => {
  const tabs = [
    { id: 'home', icon: HomeIcon, label: 'Home' },
    { id: 'learn', icon: BookOpenIcon, label: 'Learn' },
    { id: 'plan', icon: CalendarIcon, label: 'Plan' },
    { id: 'community', icon: UsersIcon, label: 'Team' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center pb-8 md:pb-3 max-w-md mx-auto shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
      {tabs.map((tab) => (
        <button 
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex flex-col items-center space-y-1 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <tab.icon className="w-6 h-6" />
          <span className="text-[10px] font-medium">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

const ProgressBar = ({ progress }: { progress: number }) => (
  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
    <div 
      className="h-full bg-gradient-to-r from-blue-500 to-sky-400 transition-all duration-500"
      style={{ width: `${progress}%` }}
    />
  </div>
);

// --- Views ---

const HomeView = ({ 
  user, 
  topics, 
  recentTopic,
  onSelectTopic 
}: { 
  user: User, 
  topics: Topic[], 
  recentTopic: Topic | null,
  onSelectTopic: (t: Topic) => void 
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string>("");

  const handleProceed = () => {
    const topic = topics.find(t => t.id === selectedEventId);
    if (topic) {
      onSelectTopic(topic);
    }
  };

  const enabledTopics = topics.filter(t => ENABLED_EVENTS.includes(t.title));
  
  // Group disabled topics by category
  const categories = Object.values(CATEGORIES);
  
  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold">Hi, Coach {user.name}!</h2>
            <p className="text-blue-100 text-sm">Level {user.level} Mentor</p>
          </div>
          <div className="flex items-center space-x-1 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
            <StarIcon fill="currentColor" className="text-yellow-300 w-4 h-4" />
            <span className="font-bold text-sm">{user.xp} XP</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm text-blue-100 bg-white/10 p-3 rounded-xl">
          <span>Daily Streak</span>
          <div className="flex space-x-1">
            {[1,2,3,4,5].map(d => (
              <div key={d} className={`w-2 h-2 rounded-full ${d <= user.streak ? 'bg-green-400' : 'bg-white/30'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Event Selection */}
      <div>
        <h3 className="text-gray-800 font-bold mb-3 flex items-center">
          <BookOpenIcon className="w-5 h-5 mr-2 text-blue-600" />
          Start Coaching
        </h3>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <label className="block text-sm font-medium text-gray-700">Select Division B Event</label>
          <div className="relative">
            <select 
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="block w-full pl-3 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg bg-gray-50 border"
            >
              <option value="" disabled>Choose an event...</option>
              <optgroup label="Available Now">
                {enabledTopics.map(topic => (
                  <option key={topic.id} value={topic.id}>{topic.title}</option>
                ))}
              </optgroup>
              {categories.map(cat => {
                const catTopics = topics.filter(t => t.category === cat && !ENABLED_EVENTS.includes(t.title));
                if (catTopics.length === 0) return null;
                return (
                  <optgroup key={cat} label={cat}>
                    {catTopics.map(topic => (
                      <option key={topic.id} value={topic.id} disabled>{topic.title}</option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>
          
          <button 
            disabled={!selectedEventId}
            onClick={handleProceed}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg shadow-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex justify-center items-center"
          >
            Go to Event Dashboard <ChevronRightIcon className="ml-2 w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="text-gray-800 font-bold mb-3 text-sm uppercase tracking-wide text-gray-400">Recent</h3>
        {recentTopic ? (
          <div 
            onClick={() => onSelectTopic(recentTopic)}
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
          >
             <div className="flex items-center">
               <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3">
                 <BrainCircuitIcon className="w-5 h-5" />
               </div>
               <div>
                 <h4 className="font-bold text-gray-800">{recentTopic.title}</h4>
                 <p className="text-xs text-gray-500">Continue where you left off</p>
               </div>
             </div>
             <ChevronRightIcon className="text-gray-400 w-5 h-5" />
          </div>
        ) : (
          <div className="bg-white p-4 rounded-xl shadow-sm opacity-60">
            <div className="flex justify-between items-center">
               <span className="text-sm text-gray-600">No recent sessions</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Types for Detail View Props
interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

interface TopicDetailProps {
  topic: Topic;
  onBack: () => void;
  onStartQuiz: (t: Topic, concept?: string) => void;
  // Lifted state props
  analogy: AnalogyType;
  setAnalogy: (a: AnalogyType) => void;
  expandedConcept: string | null;
  setExpandedConcept: (s: string | null) => void;
  conceptExplanations: Record<string, string>;
  setConceptExplanations: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

const TopicDetailView = ({ 
  topic, 
  onBack,
  onStartQuiz,
  analogy,
  setAnalogy,
  expandedConcept,
  setExpandedConcept,
  conceptExplanations,
  setConceptExplanations,
  searchQuery,
  setSearchQuery,
  chatHistory,
  setChatHistory
}: TopicDetailProps) => {
  const [loadingConcept, setLoadingConcept] = useState(false);
  const [qaQuestion, setQaQuestion] = useState("");
  const [qaLoading, setQaLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, qaLoading]);

  const handleExpandConcept = async (concept: string) => {
    if (expandedConcept === concept) {
      setExpandedConcept(null);
      return;
    }

    setExpandedConcept(concept);
    
    const cacheKey = `${concept}-${analogy}`;
    if (!conceptExplanations[cacheKey]) {
      setLoadingConcept(true);
      const explanation = await GeminiService.explainConcept(topic.title, concept, analogy);
      setConceptExplanations(prev => ({
        ...prev,
        [cacheKey]: explanation
      }));
      setLoadingConcept(false);
    }
  };

  useEffect(() => {
    if (expandedConcept) {
      const cacheKey = `${expandedConcept}-${analogy}`;
      if (!conceptExplanations[cacheKey]) {
        const fetchNewAnalogy = async () => {
          setLoadingConcept(true);
          const explanation = await GeminiService.explainConcept(topic.title, expandedConcept, analogy);
          setConceptExplanations(prev => ({
            ...prev,
            [cacheKey]: explanation
          }));
          setLoadingConcept(false);
        };
        fetchNewAnalogy();
      }
    }
  }, [analogy, expandedConcept, topic.title, conceptExplanations]);

  const handleAskQuestion = async () => {
    if (!qaQuestion.trim()) return;
    
    const currentQuestion = qaQuestion;
    setQaQuestion(""); // Clear input
    
    // Optimistic update
    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', text: currentQuestion }];
    setChatHistory(newHistory);
    
    setQaLoading(true);
    // Send updated history to service for context
    const answer = await GeminiService.askQuestion(topic.title, currentQuestion, newHistory);
    
    setChatHistory(prev => [...prev, { role: 'model', text: answer }]);
    setQaLoading(false);
  };

  const filteredConcepts = (topic.concepts || [])
    .filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => a.localeCompare(b));

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-gray-500 flex items-center hover:text-blue-600">
          <ChevronRightIcon className="w-5 h-5 rotate-180 mr-1" /> Back
        </button>
        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-right max-w-[50%] leading-tight">
          {topic.category}
        </span>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">{topic.title}</h1>
        <p className="text-gray-500 text-sm">{topic.description}</p>
        <ProgressBar progress={topic.progress} />
      </div>

      {/* Analogy Selector */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
          Explanation Style
        </label>
        <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
          {(['Default', 'Sports', 'Dance', 'Cooking'] as AnalogyType[]).map((type) => (
            <button
              key={type}
              onClick={() => setAnalogy(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                analogy === type 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Concepts List */}
      <div>
        <div className="flex justify-between items-end mb-3">
          <h3 className="font-bold text-gray-800 flex items-center">
            <BrainCircuitIcon className="w-5 h-5 mr-2 text-blue-600" />
            Core Concepts
          </h3>
        </div>
        
        <div className="mb-4 relative">
          <input
            type="text"
            placeholder="Search concepts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-3">
          {filteredConcepts.map((concept, idx) => {
            const isExpanded = expandedConcept === concept;
            const explanation = conceptExplanations[`${concept}-${analogy}`];

            return (
              <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all">
                <button 
                  onClick={() => handleExpandConcept(concept)}
                  className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-800">{concept}</span>
                  <ChevronRightIcon className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </button>
                
                {isExpanded && (
                  <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-2">
                    <div className={`p-4 rounded-lg leading-relaxed ${
                      analogy !== 'Default' ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50'
                    }`}>
                      {loadingConcept ? (
                        <div className="flex items-center space-x-2 text-blue-500 text-sm">
                           <WandIcon className="w-4 h-4 animate-pulse" />
                           <span>Generating {analogy.toLowerCase()} explanation...</span>
                        </div>
                      ) : (
                        <>
                          <div 
                            className="prose prose-sm prose-blue max-w-none text-gray-700"
                            dangerouslySetInnerHTML={{ __html: explanation }} 
                          />
                          <div className="mt-4 pt-4 border-t border-gray-200/50 flex flex-col sm:flex-row justify-between items-center gap-3">
                            {analogy !== 'Default' && (
                               <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-white px-2 py-1 rounded self-start">
                                 {analogy} Analogy
                               </span>
                            )}
                            <button 
                              onClick={() => onStartQuiz(topic, concept)}
                              className="w-full sm:w-auto px-4 py-2 bg-blue-100 text-blue-700 text-sm font-bold rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center"
                            >
                              <CheckCircleIcon className="w-4 h-4 mr-1" />
                              Test Knowledge
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Ask AI Section */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-5 rounded-2xl border border-blue-100 shadow-sm">
        <h3 className="font-bold text-gray-800 flex items-center mb-3">
          <WandIcon className="w-5 h-5 mr-2 text-indigo-600" />
          Ask anything
        </h3>
        
        {/* Chat Interface */}
        <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto pr-1">
          {chatHistory.length === 0 && !qaLoading && (
            <p className="text-xs text-gray-500 mb-3 text-center italic">Stuck on a rule or concept? Ask anything!</p>
          )}

          {chatHistory.map((msg, idx) => (
             <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl p-3 text-sm animate-in fade-in zoom-in-95 ${
                   msg.role === 'user' 
                   ? 'bg-indigo-600 text-white rounded-br-none' 
                   : 'bg-white border border-indigo-100 text-gray-700 rounded-bl-none shadow-sm'
                }`}>
                   {msg.role === 'model' ? (
                      <div dangerouslySetInnerHTML={{ __html: msg.text }} className="prose prose-sm prose-indigo max-w-none"/>
                   ) : (
                      msg.text
                   )}
                </div>
             </div>
          ))}

          {/* Loading Bubble */}
          {qaLoading && (
            <div className="flex justify-start">
               <div className="bg-white border border-indigo-100 text-indigo-600 rounded-xl rounded-bl-none p-3 shadow-sm flex items-center space-x-2 animate-pulse">
                  <WandIcon className="w-4 h-4 animate-spin" />
                  <span className="text-xs font-bold">Generating explanation...</span>
               </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={qaQuestion}
            onChange={(e) => setQaQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
            placeholder="e.g. How does the skirt width affect lift?"
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:outline-none text-sm"
          />
          <button 
            onClick={handleAskQuestion}
            disabled={qaLoading || !qaQuestion.trim()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            Ask
          </button>
        </div>
      </div>

      {/* Global Quiz Action */}
      <div className="pt-4">
        <button 
          onClick={() => onStartQuiz(topic)}
          className="w-full bg-gradient-to-r from-blue-600 to-sky-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 active:scale-[0.98] transition-all flex items-center justify-center"
        >
          <WandIcon className="mr-2 w-5 h-5" />
          Generate Quiz (10 Qs)
        </button>
      </div>
    </div>
  );
};

const QuizView = ({ 
  topic, 
  concept,
  onClose,
  onComplete
}: { 
  topic: Topic, 
  concept?: string | null,
  onClose: () => void,
  onComplete: (score: number) => void
}) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const fetchQuiz = async () => {
      // Pass concept if it exists, otherwise undefined triggers the global 10-q quiz
      const qs = await GeminiService.generateQuizForTopic(topic.title, concept || undefined);
      setQuestions(qs);
      setLoading(false);
    };
    fetchQuiz();
  }, [topic.title, concept]);

  const handleAnswer = (option: string) => {
    if (showFeedback) return;
    setSelectedAnswer(option);
    setShowFeedback(true);
    if (option === questions[currentIdx].correctAnswer) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(c => c + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      onComplete(score);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-6"></div>
        <h3 className="text-xl font-bold text-gray-800">Generating Quiz...</h3>
        <p className="text-gray-500 mt-2">
          {concept ? `Crafting questions about ${concept}` : `Building a comprehensive quiz for ${topic.title}`}
        </p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center mt-20">
        <p>Failed to load questions. Please try again.</p>
        <button onClick={onClose} className="mt-4 text-blue-600 font-bold">Go Back</button>
      </div>
    );
  }

  const currentQ = questions[currentIdx];

  return (
    <div className="pb-20">
      <div className="flex justify-between items-center mb-6">
        <span className="text-sm font-bold text-gray-400">Question {currentIdx + 1}/{questions.length}</span>
        <button onClick={onClose} className="text-gray-400 text-sm">Quit</button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm mb-6 min-h-[120px] flex items-center">
        <h2 className="text-lg font-bold text-gray-800 leading-relaxed">{currentQ.question}</h2>
      </div>

      <div className="space-y-3">
        {currentQ.options.map((opt, idx) => {
          let stateClass = "bg-white border-gray-200 text-gray-700";
          if (showFeedback) {
            if (opt === currentQ.correctAnswer) stateClass = "bg-green-100 border-green-500 text-green-800 font-bold";
            else if (opt === selectedAnswer) stateClass = "bg-red-100 border-red-500 text-red-800";
            else stateClass = "opacity-50";
          } else if (selectedAnswer === opt) {
            stateClass = "bg-blue-50 border-blue-500 text-blue-800";
          }

          return (
            <button
              key={idx}
              onClick={() => handleAnswer(opt)}
              disabled={showFeedback}
              className={`w-full p-4 text-left rounded-xl border-2 transition-all ${stateClass}`}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {showFeedback && (
        <div className="mt-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-900 mb-4 border border-blue-100">
            <strong>Explanation:</strong> {currentQ.explanation}
          </div>
          <button 
            onClick={handleNext}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-blue-700"
          >
            {currentIdx === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
          </button>
        </div>
      )}
    </div>
  );
};

const PlanView = ({ topics }: { topics: Topic[] }) => {
  const [plans, setPlans] = useState<WeekPlan[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGeneratePlan = async () => {
    setLoading(true);
    // Use first 3 topics for demo plan if none selected or too many
    const topicNames = topics.slice(0,3).map(t => t.title);
    const result = await GeminiService.generateWeeklyPlan("April 15th", topicNames);
    setPlans(result);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Weekly Plan</h2>
        <button 
          onClick={handleGeneratePlan}
          disabled={loading || plans.length > 0}
          className="bg-blue-600 text-white text-xs px-4 py-2 rounded-lg font-bold flex items-center disabled:opacity-50"
        >
          {loading ? (
             <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"/>
          ) : <WandIcon className="w-3 h-3 mr-2" />}
          {plans.length > 0 ? "Regenerate" : "AI Generate Plan"}
        </button>
      </div>

      {plans.length === 0 && !loading && (
         <div className="bg-white p-8 rounded-2xl text-center border-dashed border-2 border-gray-200">
           <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
           <p className="text-gray-500 mb-4">No plan active.</p>
           <p className="text-sm text-gray-400">Click the AI button to create a structured study schedule.</p>
         </div>
      )}

      {loading && (
        <div className="space-y-4">
          {[1,2,3].map(i => (
             <div key={i} className="bg-white p-4 rounded-xl shadow-sm animate-pulse h-32"></div>
          ))}
        </div>
      )}

      <div className="space-y-6">
        {plans.map((week) => (
          <div key={week.weekNumber} className="relative pl-8 border-l-2 border-blue-100">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-4 border-white shadow-sm"></div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Week {week.weekNumber}: {week.focus}</h3>
            
            <div className="space-y-3 mt-3">
              {week.tasks.map((task, i) => (
                <div key={i} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex items-center">
                   <div className={`w-5 h-5 rounded border mr-3 flex items-center justify-center ${task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                     {task.completed && <CheckCircleIcon className="text-white w-3 h-3" />}
                   </div>
                   <span className="text-sm text-gray-700">{task.title}</span>
                   <span className="ml-auto text-[10px] font-bold text-gray-400 uppercase bg-gray-50 px-2 py-1 rounded">{task.type}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Main App Component ---

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [user, setUser] = useState<User>(MOCK_USER);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [recentTopic, setRecentTopic] = useState<Topic | null>(null);
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [quizConcept, setQuizConcept] = useState<string | null>(null);

  // --- Lifted State for Learn Tab persistence ---
  const [analogy, setAnalogy] = useState<AnalogyType>('Default');
  const [expandedConcept, setExpandedConcept] = useState<string | null>(null);
  const [conceptExplanations, setConceptExplanations] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  // Wrapper to handle topic selection and update history
  const handleSelectTopic = (topic: Topic) => {
    // If switching topics, optionally reset the learn tab state, or keep it per-topic (too complex for now, just resetting if topic changes)
    if (selectedTopic?.id !== topic.id) {
       setExpandedConcept(null);
       setSearchQuery("");
       setChatHistory([]); // Reset chat for new topic
       // conceptExplanations are cached by concept name, so we can keep them!
    }
    
    setSelectedTopic(topic);
    setRecentTopic(topic);
    setActiveTab('learn'); // Auto switch to learn tab
  };

  const handleStartQuiz = (topic: Topic, concept?: string) => {
    setQuizConcept(concept || null);
    setIsQuizMode(true);
  };

  const handleCompleteQuiz = (score: number) => {
    // Add XP (more for full quiz)
    const xpGained = score * (quizConcept ? 30 : 50);
    setUser(prev => ({
      ...prev,
      xp: prev.xp + xpGained,
      streak: prev.streak + 1 // Simply increment for demo
    }));
    setIsQuizMode(false);
    setQuizConcept(null);
    alert(`Quiz Complete! You earned ${xpGained} XP!`);
  };

  const renderContent = () => {
    if (isQuizMode && selectedTopic) {
      return (
        <QuizView 
          topic={selectedTopic} 
          concept={quizConcept}
          onClose={() => setIsQuizMode(false)}
          onComplete={handleCompleteQuiz}
        />
      );
    }

    // Home always shows the event selection screen
    if (activeTab === 'home') {
      return <HomeView user={user} topics={MOCK_TOPICS} recentTopic={recentTopic} onSelectTopic={handleSelectTopic} />;
    }

    // Learn shows detail if topic selected, or list otherwise
    if (activeTab === 'learn') {
       if (selectedTopic) {
          return (
            <TopicDetailView 
              topic={selectedTopic} 
              onBack={() => setSelectedTopic(null)} 
              onStartQuiz={handleStartQuiz}
              analogy={analogy}
              setAnalogy={setAnalogy}
              expandedConcept={expandedConcept}
              setExpandedConcept={setExpandedConcept}
              conceptExplanations={conceptExplanations}
              setConceptExplanations={setConceptExplanations}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              chatHistory={chatHistory}
              setChatHistory={setChatHistory}
            />
          );
       } else {
          // Fallback list if no topic selected yet
          return (
             <div className="space-y-4">
               <h2 className="text-2xl font-bold text-gray-800 mb-6">All Events</h2>
               <div className="grid gap-4">
                 {MOCK_TOPICS.map(topic => (
                   <div 
                     key={topic.id} 
                     onClick={() => handleSelectTopic(topic)}
                     className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 active:scale-95 transition-transform cursor-pointer"
                   >
                     <div className="flex justify-between items-start mb-3">
                       <span className={`text-xs font-bold px-2 py-1 rounded text-blue-700 bg-blue-50`}>
                         {topic.category}
                       </span>
                       <ChevronRightIcon className="text-gray-400 w-5 h-5" />
                     </div>
                     <h3 className="text-lg font-bold text-gray-800 mb-1">{topic.title}</h3>
                   </div>
                 ))}
               </div>
             </div>
          );
       }
    }

    switch (activeTab) {
      case 'plan':
        return <PlanView topics={MOCK_TOPICS} />;
      case 'community':
        return (
          <div className="text-center mt-20 text-gray-500">
            <UsersIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="font-bold text-gray-700">Community Coming Soon</h3>
            <p>Share prototypes and chat with other parents.</p>
          </div>
        );
      default:
        // Fallback should normally not be reached if Home is handled above
        return <HomeView user={user} topics={MOCK_TOPICS} recentTopic={recentTopic} onSelectTopic={handleSelectTopic} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-20 font-sans">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl relative overflow-hidden">
        {/* Mobile Headerish */}
        <div className="pt-6 px-6 pb-2 bg-white sticky top-0 z-10">
           <div className="flex justify-between items-center mb-4">
             <div className="flex items-center space-x-2 text-blue-700 font-bold text-lg">
                <BrainCircuitIcon className="text-blue-600" />
                <span>SciOly Coach</span>
             </div>
           </div>
        </div>

        {/* Scrollable Content */}
        <div className="px-6">
          {renderContent()}
        </div>

        {/* Navigation */}
        {!isQuizMode && (
          <BottomNav activeTab={activeTab} onTabChange={(t) => {
            setActiveTab(t);
            // We no longer reset selectedTopic on 'home' because user wants to return to state. 
            // However, Home view logic specifically renders HomeView regardless of selectedTopic.
            // If user clicks Learn, it shows selectedTopic state.
          }} />
        )}
      </div>
    </div>
  );
}