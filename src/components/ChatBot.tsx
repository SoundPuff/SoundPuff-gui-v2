import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, X, Send, Music2, Sparkles, Loader2, ListMusic, User as UserIcon, Play, Plus, Check, Save } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Import Services
import { searchService } from '../services/searchService';
import { playlistService } from '../services/playlistService';

// Import Player Context
import { usePlayer } from '../contexts/PlayerContext';

// ✅ GÜVENLİK VE TYPE FIX: 
// TypeScript hatasını önlemek için (import.meta as any) kullanıldı.
const OPENROUTER_API_KEY = (import.meta as any).env.VITE_OPENROUTER_API_KEY; 

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'card';
  data?: any;
}

// Playlist Taslak Tipi
interface PlaylistDraft {
  isActive: boolean;
  title: string;
  description: string;
  selectedSongIds: string[];
}

export function ChatBot() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { playSong } = usePlayer();

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Playlist Taslak State'i
  const [playlistDraft, setPlaylistDraft] = useState<PlaylistDraft>({
    isActive: false,
    title: "",
    description: "",
    selectedSongIds: []
  });

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm SoundPuff AI. I can help you search songs and popular playlists, find users and create playlists interactively. Try saying 'Create a playlist named Road Trip'. How can I help you?",
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

  // SİSTEM KOMUTLARI
  const SYSTEM_PROMPT = `
    You are SoundPuff's intelligent music assistant.
    
    IMPORTANT: Reply with a JSON object ONLY. Do not wrap it in markdown.
    
    Available Actions:
    1. Search Music: 
       Reply: {"action": "search", "query": "search term"}
       
    2. Start Playlist Creation (User wants to build a playlist): 
       Reply: {"action": "start_playlist_draft", "title": "Playlist Name", "description": "Optional description"}
       Example: "Make a rock playlist" -> {"action": "start_playlist_draft", "title": "Rock Playlist", "description": "Created by AI"}
       
    3. Get Popular Playlists:
       Reply: {"action": "get_popular_playlists", "limit": 5}
       
    4. Navigate: 
       Reply: {"action": "navigate", "path": "/app/..."}

    If the user is currently selecting songs for a playlist (you will know from context), just help them search for songs using action #1.
  `;

  const processAIResponse = async (userText: string) => {
    // API Key kontrolü
    if (!OPENROUTER_API_KEY) {
      //addBotMessage("Configuration Error: API Key is missing in .env file.");
      //console.error("Lütfen .env dosyanızda VITE_OPENROUTER_API_KEY tanımlı olduğundan emin olun.");
      return;
    }

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
      addBotMessage("I'm having trouble connecting right now.");
    }
  };

  const executeCommand = async (cmd: any) => {
    setIsTyping(true);
    try {
      // 1. SEARCH ACTION
      if (cmd.action === 'search') {
        const results = await searchService.searchAll(cmd.query);
        
        if (results.songs.length > 0 || results.playlists.length > 0 || results.users.length > 0) {
          // Mesaj draft moduna göre değişir
          const msgText = playlistDraft.isActive 
            ? `Here are songs for "${cmd.query}". Click on them to add to "${playlistDraft.title}":`
            : `Here is what I found for "${cmd.query}".\n\n💡 Tip: Click on a song to play it.`;

          addBotMessage(msgText);
          
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
      
      // 2. START PLAYLIST DRAFT
      else if (cmd.action === 'start_playlist_draft') {
        if (!user) {
          addBotMessage("You need to be logged in to create playlists.");
          return;
        }
        
        setPlaylistDraft({
          isActive: true,
          title: cmd.title || "New Playlist",
          description: cmd.description || "Created with AI",
          selectedSongIds: []
        });

        addBotMessage(`started creating "${cmd.title}". Now search for songs (e.g. "Tarkan songs") and select them using the list below.`);
      }

      // 3. POPULAR PLAYLISTS
      else if (cmd.action === 'get_popular_playlists') {
        const allPlaylists = await playlistService.getPlaylists(0, 50);
        const popularPlaylists = allPlaylists
            .sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
            .slice(0, cmd.limit || 5);

        if (popularPlaylists.length > 0) {
            addBotMessage(`Here are the top ${popularPlaylists.length} most popular playlists:`);
            const resultMessage: Message = {
                id: Date.now().toString(),
                text: 'Popular Playlists',
                sender: 'bot',
                timestamp: new Date(),
                type: 'card',
                data: { playlists: popularPlaylists, songs: [], users: [] }
            };
            setMessages(prev => [...prev, resultMessage]);
        } else {
            addBotMessage("I couldn't find any playlists right now.");
        }
      }

      // 4. NAVIGATE
      else if (cmd.action === 'navigate') {
        navigate(cmd.path);
        addBotMessage(`Navigating to ${cmd.path}...`);
      }
    } catch (error) {
      console.error("Exec Error:", error);
      addBotMessage("I tried to perform that action but something went wrong.");
    } finally {
      setIsTyping(false);
    }
  };

  // Şarkı Seç/Kaldır Fonksiyonu
  const toggleSongSelection = (songId: string) => {
    setPlaylistDraft(prev => {
      const isSelected = prev.selectedSongIds.includes(songId);
      const newIds = isSelected 
        ? prev.selectedSongIds.filter(id => id !== songId)
        : [...prev.selectedSongIds, songId];
      
      return { ...prev, selectedSongIds: newIds };
    });
  };

  // Playlisti Kaydet
  const savePlaylist = async () => {
    if (playlistDraft.selectedSongIds.length === 0) {
      addBotMessage("Please select at least one song first.");
      return;
    }

    try {
      setIsTyping(true);
      await playlistService.createPlaylist({
        title: playlistDraft.title,
        description: playlistDraft.description,
        privacy: 'public',
        song_ids: playlistDraft.selectedSongIds.map(id => parseInt(id)) 
      });

      addBotMessage(`✅ Playlist "${playlistDraft.title}" created successfully with ${playlistDraft.selectedSongIds.length} songs!`);
      
      setPlaylistDraft({ isActive: false, title: "", description: "", selectedSongIds: [] });
      navigate('/app/library');

    } catch (error) {
      console.error("Save Playlist Error:", error);
      addBotMessage("Failed to create playlist. Please try again.");
    } finally {
      setIsTyping(false);
    }
  };

  // Draft İptal
  const cancelDraft = () => {
    setPlaylistDraft({ isActive: false, title: "", description: "", selectedSongIds: [] });
    addBotMessage("Playlist creation cancelled.");
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
      {data.songs?.slice(0, 3).map((song: any) => {
        // DRAFT KONTROLÜ
        const isDraftActive = playlistDraft.isActive;
        const isSelected = playlistDraft.selectedSongIds.includes(song.id);

        return (
          <div 
            key={song.id} 
            className={`flex items-center gap-2 p-2 rounded hover:bg-gray-800 cursor-pointer border transition-all group ${
                isSelected 
                  ? 'bg-pink/10 border-pink' 
                  : 'bg-gray-800 border-gray-700/50'
            }`}
            // Eğer draft açıksa seç, değilse çal
            onClick={() => isDraftActive ? toggleSongSelection(song.id) : playSong(song)}
          >
            <div className="bg-gray-700 w-8 h-8 rounded flex items-center justify-center shrink-0 overflow-hidden relative">
              {song.coverArt ? (
                <>
                  <img src={song.coverArt} alt={song.title} className="w-full h-full object-cover"/>
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* İkon Duruma Göre Değişir */}
                    {isDraftActive ? (
                       isSelected ? <Check className="w-4 h-4 text-green-400" /> : <Plus className="w-4 h-4 text-white" />
                    ) : (
                       <Play className="w-3 h-3 text-white fill-white" />
                    )}
                  </div>
                </>
              ) : (
                <Music2 className="w-4 h-4" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-bold truncate ${isSelected ? 'text-pink' : 'text-white group-hover:text-pink'}`}>
                  {song.title}
              </p>
              <p className="text-[10px] text-gray-400 truncate">{song.artist}</p>
            </div>

            {/* Sağ tarafta seçim göstergesi (Sadece draft modunda) */}
            {isDraftActive && (
               <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'bg-pink border-pink' : 'border-gray-500'}`}>
                  {isSelected && <Check className="w-3 h-3 text-black" />}
               </div>
            )}
          </div>
        );
      })}

      {/* PLAYLISTS */}
      {data.playlists?.map((pl: any) => (
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
          {/* Header */}
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

          {/* DRAFT MODU BİLGİ ÇUBUĞU */}
          {playlistDraft.isActive && (
            <div className="flex-none bg-gray-800 p-2 px-4 flex items-center justify-between border-b border-gray-700 animate-in slide-in-from-top-2">
                <div className="flex flex-col min-w-0">
                    <span className="text-xs text-pink font-bold truncate">Creating: {playlistDraft.title}</span>
                    <span className="text-[10px] text-gray-400">{playlistDraft.selectedSongIds.length} songs selected</span>
                </div>
                <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="ghost" onClick={cancelDraft} className="h-7 px-2 text-[10px] text-red-400 hover:text-red-300 hover:bg-red-900/20">
                        Cancel
                    </Button>
                    <Button size="sm" onClick={savePlaylist} className="h-7 px-2 text-[10px] bg-green-600 hover:bg-green-500 text-white">
                        <Save className="w-3 h-3 mr-1"/> Save
                    </Button>
                </div>
            </div>
          )}

          {/* Messages Area */}
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

          {/* Input Area */}
          <div className="flex-none p-3 border-t border-gray-800 bg-gray-900">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                // Draft modu varsa placeholder değişsin
                placeholder={playlistDraft.isActive ? "Search songs to add..." : "Ask SoundPuff AI..."}
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