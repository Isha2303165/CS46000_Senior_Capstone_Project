import * as React from 'react';
import { useEffect, useState } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import Toolbar from '@mui/material/Toolbar';
import Slide from '@mui/material/Slide';
import Box from '@mui/material/Box';
import AppTheme from '../shared-theme/AppTheme';
import AppBar from '../app-bar/AppBar';
import ChatContainer from './components/ChatContainer';
import { useRef } from 'react';
import { validateToken } from '../validateToken';

export default function PlannerBot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);
  const [typingText, setTypingText] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [profileData, setProfileData] = useState({});
  const [animationTriggered, setAnimationTriggered] = useState(false);
  const initialized = useRef(false);

  const safeMessages = Array.isArray(messages) ? messages : [];



  React.useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationTriggered(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);



  const startChatSession = React.useCallback(async () => {
    const tokenCheck = await validateToken();

    if (!tokenCheck.valid) {
        alert("Your session has expired. Please log in again.");
        localStorage.removeItem("token");
        return;
    }
    await addBotMessage('Hello! I am NestWiseAI. How can I help you today?')
    const token = localStorage.getItem('token'); 

    try {
      const res = await fetch('http://localhost:8000/chatbot/start', {
        method: 'POST',
        headers: { 
          "Authorization": `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (res.status === 401) {
            alert("Your session has expired. Please log in again.");
            localStorage.removeItem("token");
            return;
        }

      if (!res.ok) throw new Error('Failed to start session');
      const data = await res.json();
      setSessionId(data.session_id);
    } catch (err) {
      console.error(err);
      await addBotMessage('Error starting session.');
    }
  }, []);




  // Start chat session only after animation completes
  React.useEffect(() => {
    if (animationTriggered && !initialized.current) {
      initialized.current = true;

      const chatSessionTimer = setTimeout(() => {
        startChatSession();
      }, 800); // Reduced from 1600 to 800

      return () => clearTimeout(chatSessionTimer);
    }
  }, [animationTriggered, startChatSession]);






  const addUserMessage = async (content) => {
    setMessages((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return [...safePrev, { role: 'user', content: content }];
    });
  };







  const addBotMessage = async (content) => {
    const simulateTypingEffect = (text) => {
      const chunkSize = Math.ceil(text.length / 10);
      let i = 0;

      return new Promise((resolve) => {
        const interval = setInterval(() => {
          i += chunkSize;
          const partialText = text.slice(0, i);

          setMessages((prev) => {
            const safePrev = Array.isArray(prev) ? prev : [];
            const updated = [...safePrev];
            const lastIndex = updated.length - 1;

            if (lastIndex >= 0 && updated[lastIndex].role === 'bot' && updated[lastIndex].isTyping) {
              updated[lastIndex] = {
                ...updated[lastIndex],
                content: partialText,
              };
            } else {
              updated.push({ role: 'bot', content: partialText, isTyping: true });
            }

            return updated;
          });

          if (i >= text.length) {
            clearInterval(interval);
            resolve(text);
          }
        }, 100);
      });
    };

    await simulateTypingEffect(content);

    setMessages((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const updated = [...safePrev];
      const lastIndex = updated.length - 1;

      if (lastIndex >= 0 && updated[lastIndex].role === 'bot') {
        updated[lastIndex] = {
          ...updated[lastIndex],
          content,
          isTyping: false,
        };
      }

      return updated;
    });
  };








  const handleSend = async () => {
    const tokenCheck = await validateToken();

    if (!tokenCheck.valid) {
        alert("Your session has expired. Please log in again.");
        localStorage.removeItem("token");
        window.location.href = "/signin";
        return;
    }
    if (!input.trim() || sending) return;

    const userInput = input.trim();
    setInput('');
    setSending(true);
    addUserMessage(userInput);

    // Add thinking animation before the API call
    const addThinkingMessage = () => {
      setMessages((prev) => {
        const safePrev = Array.isArray(prev) ? prev : [];
        return [...safePrev, {
          role: 'bot',
          content: '',
          isThinking: true,
          id: Date.now() // unique ID for the thinking message
        }];
      });
    };

    const removeThinkingMessage = () => {
      setMessages((prev) => {
        const safePrev = Array.isArray(prev) ? prev : [];
        return safePrev.filter(msg => !msg.isThinking);
      });
    };

    // Show thinking animation
    addThinkingMessage();
    const token = localStorage.getItem('token');

    try {
      if (!sessionId) throw new Error('Session not started');

      const res = await fetch('http://localhost:8000/chatbot/answer', {
        method: 'POST',
        headers: { 
          "Authorization": `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          session_id: sessionId,
          message: userInput,
        }),
      });

      if (res.status === 401) {
            removeThinkingMessage();
            alert("Your session has expired. Please log in again.");
            localStorage.removeItem("token");
            return;
        }

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data = await res.json();

      if (data.real_profile) {
        setProfileData(data.real_profile);
      }

      removeThinkingMessage();
      await addBotMessage(data.response);


    } catch (err) {

      console.error(err);
      removeThinkingMessage();
      await addBotMessage(`Error: ${err.message}`);


    } finally {
      setSending(false);
    }
  };









  const handleFileUpload = (event) => {
    const files = event.target.files;
    if (files.length > 0) console.log('Uploaded files:', files);
  };



  //  GET LAST CHAT RESPONSE FOR CONTEXT IN OTHER FUNCTIONS
  const getLastChatbotResponse = () => {
    const lastBotMessage = safeMessages
      .filter(msg => msg.role === 'bot' && !msg.isThinking)
      .slice(-1)[0];
    return lastBotMessage ? lastBotMessage.content : '';
  };






  return (
    <AppTheme>
      <CssBaseline />
      <AppBar />

      <Box
        sx={{
          position: 'fixed',
          top: 48, // Dense AppBar is typically 48px instead of 64px
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: 'calc(100vh - 48px)', // Adjusted for dense AppBar
          overflow: 'hidden'
        }}
      >
        <Slide direction="up" in={animationTriggered} timeout={800}>
          <Box sx={{ width: '100%', height: '100%', display: 'flex' }}>
            <ChatContainer
              animationTriggered={animationTriggered}
              profileData={profileData}
              lastChatbotResponse={getLastChatbotResponse()}
              safeMessages={safeMessages}
              input={input}
              setInput={setInput}
              handleSend={handleSend}
              handleFileUpload={handleFileUpload}
              sending={sending}
            />
          </Box>
        </Slide>
      </Box>

    </AppTheme>
  );


}