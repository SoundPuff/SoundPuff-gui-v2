import React from 'react';
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Music2, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your SoundPuff music assistant. I can help you discover new music, recommend playlists, or answer questions about genres and artists. What would you like to know?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const generateBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    // Music genre recommendations
    if (lowerMessage.includes('recommend') && (lowerMessage.includes('genre') || lowerMessage.includes('music'))) {
      return "Based on popular trends, I'd recommend checking out: Lo-fi Hip Hop for relaxation, Indie Folk for storytelling, or Electronic Dance for energy. What mood are you in?";
    }

    // Playlist suggestions
    if (lowerMessage.includes('playlist')) {
      return "Great choice! For playlists, try exploring: 'Chill Vibes' for studying, 'Workout Energy' for the gym, or 'Sunday Morning' for a relaxed weekend. You can create your own by clicking the Create Playlist button!";
    }

    // Artist recommendations
    if (lowerMessage.includes('artist')) {
      return "Some trending artists on SoundPuff include The Midnight, ODESZA, and Flume for electronic vibes, or Phoebe Bridgers and Bon Iver for indie sounds. Want suggestions in a specific genre?";
    }

    // New music discovery
    if (lowerMessage.includes('new') || lowerMessage.includes('discover')) {
      return "To discover new music on SoundPuff, try: 1) Following users with similar tastes in the Search tab, 2) Exploring the Home feed for trending playlists, or 3) Creating collaborative playlists with friends!";
    }

    // Genre questions
    if (lowerMessage.includes('rock') || lowerMessage.includes('pop') || lowerMessage.includes('jazz') || lowerMessage.includes('hip hop') || lowerMessage.includes('electronic')) {
      return `Great taste! For that genre, I'd suggest checking out playlists in the Search tab. You can also filter by mood and era. Want me to recommend some specific artists or albums?`;
    }

    // Mood-based recommendations
    if (lowerMessage.includes('happy') || lowerMessage.includes('sad') || lowerMessage.includes('relax') || lowerMessage.includes('energy')) {
      return "Music for your mood is important! Try searching for playlists with keywords like 'upbeat', 'melancholy', 'calm', or 'energetic'. The SoundPuff community has amazing curated selections!";
    }

    // Default responses
    const defaultResponses = [
      "That's interesting! I can help you find music based on genre, mood, or artist. What are you looking for?",
      "I'd love to help! Try asking me about music recommendations, playlist ideas, or discovering new artists.",
      "Great question! You can explore the Search tab to find users, playlists, and songs. Need help with something specific?",
      "Music is all about discovery! Want me to suggest some genres, artists, or help you create the perfect playlist?",
    ];

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // Simulate bot response delay
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: generateBotResponse(input),
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-green-500 hover:bg-green-600 shadow-lg z-50"
          size="icon"
          style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem'}}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div 
          className="fixed bottom-6 right-6 w-96 h-[500px] bg-gray-900 dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col z-50 border border-gray-700"
          style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem' }}
          >
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-green-500">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-white" />
              <h3 className="text-white">Music Assistant</h3>
            </div>
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-green-600"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.sender === 'user'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-700 text-gray-100'
                    }`}
                  >
                    {message.sender === 'bot' && (
                      <div className="flex items-center gap-2 mb-1">
                        <Music2 className="w-4 h-4 text-green-400" />
                        <span className="text-green-400">SoundPuff Bot</span>
                      </div>
                    )}
                    <p className="break-words">{message.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about music..."
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
              />
              <Button
                onClick={handleSend}
                size="icon"
                className="bg-green-500 hover:bg-green-600"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
