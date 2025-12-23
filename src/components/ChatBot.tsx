import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, X, Send, Music2, Sparkles, Loader2, ListMusic, User as UserIcon, Play } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Import Services
import { searchService } from '../services/searchService';
import { playlistService } from '../services/playlistService';

// Import Player Context
import { usePlayer } from '../contexts/PlayerContext';

// ⚠️ PRODUCTION'DA .ENV DOSYASINA TAŞIYIN
const OPENROUTER_API_KEY = "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"; 

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'card';
  data?: any;
}

export function ChatBot() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { playSong } = usePlayer();

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm SoundPuff AI. I can create playlists, search for songs, or find users for you. How can I help?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // ✅ SİSTEM KOMUTLARI GÜNCELLENDİ: "Get Popular Playlists" eklendi
  const SYSTEM_PROMPT = `
    You are SoundPuff's intelligent music assistant. You have access to the app's functions.
    
    IMPORTANT: If the user wants to perform an action, you MUST reply with a JSON object ONLY. Do not wrap it in markdown.
    
    Available Actions:
    1. Search Music (Songs/Playlists/Users): 
       Reply: {"action": "search", "query": "search term"}
       
    2. Create Playlist: 
       Reply: {"action": "create_playlist", "title": "Playlist Name", "description": "Optional description"}
       
    3. Navigate/Go to pages: 
       Reply: {"action": "navigate", "path": "/app/..."}
       
    4. Get Popular Playlists:
       Reply: {"action": "get_popular_playlists", "limit": 5}
       Example: User says "Show me top 5 popular playlists" -> You reply: {"action": "get_popular_playlists", "limit": 5}

    If no action is needed, reply casually as a helpful music assistant in plain text.
    Always communicate in English.
  `;

  const processAIResponse = async (userText: string) => {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "SoundPuff",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "google/gemma-3-27b-it:free",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages.slice(-5).filter(m => !m.type).map(m => ({ 
              role: m.sender === 'user' ? 'user' : 'assistant',
              content: m.text
            })),
            { role: "user", content: userText }
          ]
        })
      });

      const data = await response.json();
      const aiContent = data.choices?.[0]?.message?.content || "Sorry, I couldn't connect to the server.";

      try {
        const cleanJson = aiContent.replace(/```json/g, '').replace(/```/g, '').trim();
        if (cleanJson.startsWith('{') && cleanJson.endsWith('}')) {
          const command = JSON.parse(cleanJson);
          await executeCommand(command);
        } else {
          addBotMessage(aiContent);
        }
      } catch (e) {
        addBotMessage(aiContent);
      }

    } catch (error) {
      console.error("AI Error:", error);
      addBotMessage("I'm having trouble connecting right now. Please try again later.");
    }
  };

  const executeCommand = async (cmd: any) => {
    setIsTyping(true);
    try {
      // 1. SEARCH ACTION
      if (cmd.action === 'search') {
        const results = await searchService.searchAll(cmd.query);
        
        if (results.songs.length > 0 || results.playlists.length > 0 || results.users.length > 0) {
          addBotMessage(`Here is what I found for "${cmd.query}".\n\n💡 Tip: Click on a song to play it, or tap a user/playlist to visit their page.`);
          
          const resultMessage: Message = {
            id: Date.now().toString(),
            text: 'Search Results',
            sender: 'bot',
            timestamp: new Date(),
            type: 'card',
            data: results
          };
          setMessages(prev => [...prev, resultMessage]);
        } else {
          addBotMessage(`I searched for "${cmd.query}" but couldn't find anything.`);
        }
      } 
      
      // ✅ YENİ: POPULAR PLAYLISTS ACTION
      else if (cmd.action === 'get_popular_playlists') {
        // En son 50 playlisti çek, like sayısına göre sırala
        const allPlaylists = await playlistService.getPlaylists(0, 50);
        const limit = cmd.limit || 5;
        
        const popularPlaylists = allPlaylists
            .sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
            .slice(0, limit);

        if (popularPlaylists.length > 0) {
            addBotMessage(`Here are the top ${popularPlaylists.length} most popular playlists based on likes:`);
            
            const resultMessage: Message = {
                id: Date.now().toString(),
                text: 'Popular Playlists',
                sender: 'bot',
                timestamp: new Date(),
                type: 'card',
                // renderSearchResults fonksiyonu playlist array bekliyor
                data: { playlists: popularPlaylists, songs: [], users: [] }
            };
            setMessages(prev => [...prev, resultMessage]);
        } else {
            addBotMessage("I couldn't find any playlists right now.");
        }
      }

      // 3. CREATE PLAYLIST ACTION
      else if (cmd.action === 'create_playlist') {
        if (!user) {
          addBotMessage("You need to be logged in to create playlists.");
          return;
        }
        await playlistService.createPlaylist({
          title: cmd.title,
          description: cmd.description || "Created by SoundPuff AI",
          privacy: 'public'
        });
        addBotMessage(`✅ Playlist "${cmd.title}" created successfully! Check your library.`);
        navigate('/app/library');
      } 
      
      // 4. NAVIGATE ACTION
      else if (cmd.action === 'navigate') {
        navigate(cmd.path);
        addBotMessage(`Navigating to ${cmd.path}...`);
      }
    } catch (error) {
      console.error("Command execution error:", error);
      addBotMessage("I tried to perform that action but something went wrong.");
    } finally {
      setIsTyping(false);
    }
  };

  const addBotMessage = (text: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text,
      sender: 'bot',
      timestamp: new Date(),
    }]);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userText = input;
    setInput('');
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text: userText,
      sender: 'user',
      timestamp: new Date(),
    }]);
    setIsTyping(true);
    await processAIResponse(userText);
    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderSearchResults = (data: any) => (
    <div className="flex flex-col gap-2 mt-2 w-full">
      {/* SONGS */}
      {data.songs?.length > 0 && <p className="text-[10px] uppercase text-gray-400 font-bold mt-1">Songs</p>}
      {data.songs?.slice(0, 3).map((song: any) => (
        <div 
          key={song.id} 
          className="flex items-center gap-2 bg-gray-800 p-2 rounded hover:bg-gray-700 cursor-pointer border border-gray-700/50 group" 
          onClick={() => playSong(song)}
        >
          <div className="bg-gray-700 w-8 h-8 rounded flex items-center justify-center shrink-0 overflow-hidden relative">
            {song.coverArt ? (
              <>
                <img src={song.coverArt} alt={song.title} className="w-full h-full object-cover"/>
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-3 h-3 text-white fill-white" />
                </div>
              </>
            ) : (
              <Music2 className="w-4 h-4" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate text-white group-hover:text-pink transition-colors">{song.title}</p>
            <p className="text-[10px] text-gray-400 truncate">{song.artist}</p>
          </div>
        </div>
      ))}

      {/* PLAYLISTS */}
      {data.playlists?.length > 0 && <p className="text-[10px] uppercase text-gray-400 font-bold mt-1">Playlists</p>}
      {data.playlists?.map((pl: any) => ( // slice kaldırıldı, gelen tüm popüler listeleri göstersin
        <div key={pl.id} className="flex items-center gap-2 bg-gray-800 p-2 rounded hover:bg-gray-700 cursor-pointer border border-gray-700/50" onClick={() => navigate(`/app/playlist/${pl.id}`)}>
          <div className="bg-gray-700 w-8 h-8 rounded flex items-center justify-center shrink-0">
            <ListMusic className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate text-white">{pl.title}</p>
            <div className="flex items-center gap-2 text-[10px] text-gray-400">
                <span>Playlist</span>
                {pl.likes_count !== undefined && (
                    <span className="text-green-400">• {pl.likes_count} likes</span>
                )}
            </div>
          </div>
        </div>
      ))}

      {/* USERS */}
      {data.users?.length > 0 && <p className="text-[10px] uppercase text-gray-400 font-bold mt-1">Users</p>}
      {data.users?.slice(0, 2).map((u: any) => (
        <div key={u.id} className="flex items-center gap-2 bg-gray-800 p-2 rounded hover:bg-gray-700 cursor-pointer border border-gray-700/50" onClick={() => navigate(`/app/user/${u.id}`)}>
          <div className="bg-gray-700 w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
             <img src={u.avatar || "https://github.com/shadcn.png"} alt={u.username} className="w-full h-full object-cover"/>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate text-white">{u.username}</p>
            <p className="text-[10px] text-gray-400">User</p>
          </div>
        </div>
      ))}
    </div>
  );

  return createPortal(
    <>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-pink hover:bg-green-600 shadow-lg z-[9999] transition-transform hover:scale-110"
          size="icon"
          style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem' }}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {isOpen && (
        <div 
          // ✅ TASARIM GÜNCELLENDİ: Opak Arka Plan (bg-gray-900)
          className="fixed w-80 sm:w-96 bg-gray-900 rounded-xl shadow-2xl flex flex-col z-[9999] border border-gray-700 animate-in slide-in-from-bottom-5 fade-in duration-300 overflow-hidden"
          style={{ 
            position: 'fixed', 
            bottom: '1.5rem', 
            right: '1.5rem', 
            height: '500px',        
            maxHeight: '80vh',      
            display: 'flex',        
            flexDirection: 'column' 
          }} 
        >
          {/* Header - Opak */}
          <div className="flex-none flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-pink/20 rounded-full">
                <Sparkles className="w-4 h-4 text-pink" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">SoundPuff AI</h3>
                <span className="flex items-center gap-1 text-[10px] text-green-400">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"/>
                  Online
                </span>
              </div>
            </div>
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full w-8 h-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages Area - Opak */}
          <div 
            className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-gray-800 min-h-0 bg-gray-900" 
            ref={scrollRef}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                    message.sender === 'user'
                      ? 'bg-pink text-black font-medium rounded-br-none'
                      : 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{message.text}</p>
                  {message.type === 'card' && message.data && renderSearchResults(message.data)}
                  <span className={`text-[9px] mt-1 block text-right ${message.sender === 'user' ? 'text-black/60' : 'text-gray-500'}`}>
                    {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-800 rounded-2xl rounded-bl-none p-3 flex items-center gap-2 border border-gray-700">
                  <Loader2 className="w-3 h-3 text-pink animate-spin" />
                  <span className="text-xs text-gray-400">Thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Area - Opak */}
          <div className="flex-none p-3 border-t border-gray-800 bg-gray-900">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask for a song or create a playlist..."
                className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500 focus:ring-1 focus:ring-pink focus:border-pink rounded-full px-4 h-10 text-sm"
                disabled={isTyping}
              />
              <Button
                onClick={handleSend}
                size="icon"
                className="bg-pink hover:bg-green-600 rounded-full w-10 h-10 shrink-0 transition-colors"
                disabled={isTyping || !input.trim()}
              >
                <Send className="h-4 w-4 text-black" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}