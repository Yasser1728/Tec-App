'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { usePiAuth } from '@/lib-client/hooks/usePiAuth';
import Link from 'next/link';
import styles from './ai.module.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  { en: 'How do I invest with Pi?', ar: 'كيف أستثمر بـ Pi؟' },
  { en: 'Show my TEC balance', ar: 'وريني رصيدي' },
  { en: 'What is Nexus.pi?', ar: 'ما هو Nexus.pi؟' },
  { en: 'Best app for real estate?', ar: 'أفضل app للعقارات؟' },
];

export default function AiPage() {
  const { t, dir, locale } = useTranslation();
  const { user, isAuthenticated } = usePiAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Welcome message
  useEffect(() => {
    setMessages([{ id: 'welcome', role: 'assistant', content: locale === 'ar' ? `مرحباً${user?.piUsername ? ` @${user.piUsername}` : ''}! 👋\n\nأنا مساعد TEC الذكي. يمكنني مساعدتك في:\n- استكشاف الـ 24 تطبيق في المنظومة\n- الإجابة على أسئلتك عن Pi Network\n- إرشادك للتطبيق المناسب لاحتياجاتك\n\nكيف يمكنني مساعدتك اليوم؟` : `Welcome${user?.piUsername ? ` @${user.piUsername}` : ''}! 👋\n\nI'm the TEC AI Assistant. I can help you:\n- Explore all 24 apps in the ecosystem\n- Answer questions about Pi Network\n- Guide you to the right app for your needs\n\nHow can I help you today?`,
    timestamp: new Date(),
    }]);
  }, [user, locale]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage]
            .filter(m => m.id !== 'welcome')
            .map(m => ({ role: m.role, content: m.content })),
          userContext: {
            username: user?.piUsername,
            locale,
          },
        }),
      });

      if (!response.ok) throw new Error('AI request failed');

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Stream the response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]' || !data) continue;

              try {
                const parsed = JSON.parse(data);
                const delta = parsed?.text ?? parsed?.delta?.text ?? parsed?.content?.[0]?.text ?? '';
                if (delta) {
                  setMessages(prev =>
                    prev.map(m =>
                      m.id === assistantMessage.id
                        ? { ...m, content: m.content + delta }
                        : m
                    )
                  );
                }
              } catch {
                // skip malformed chunks
              }
            }
          }
        }
      }
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: locale === 'ar'
          ? '❌ حدث خطأ. يرجى المحاولة مرة أخرى.'
          : '❌ Something went wrong. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <main className={styles.main} dir={dir}>

      {/* Background */}
      <div className={styles.bg} aria-hidden>
        <div className={styles.bgOrb} />
        <div className={styles.bgGrid} />
      </div>

      {/* Header */}
      <header className={styles.header}>
        <Link href='/' className={styles.backLink}>← TEC</Link>
        <div className={styles.headerCenter}>
          <span className={styles.headerIcon}>🤖</span>
          <div>
            <p className={styles.headerTitle}>TEC Assistant</p>
            <p className={styles.headerSub}>{locale === 'ar' ? 'مساعدك الذكي في منظومة TEC' : 'Your AI guide to TEC ecosystem'}</p>
          </div>
        </div>
        <div className={styles.headerStatus}>
          <span className={styles.statusDot} />
          <span className={styles.statusText}>{locale === 'ar' ? 'نشط' : 'Online'}</span>
        </div>
      </header>

      {/* Messages */}
      <div className={styles.messagesWrap}>
        <div className={styles.messages}>
          {messages.map(msg => (
            <div key={msg.id} className={`${styles.message} ${msg.role === 'user' ? styles.messageUser : styles.messageAssistant}`}>  
              {msg.role === 'assistant' && (<span className={styles.messageAvatar}>🤖</span>)}
              <div className={styles.messageBubble}>
                <p className={styles.messageContent}>{msg.content}</p>
                <span className={styles.messageTime}>{msg.timestamp.toLocaleTimeString(locale === 'ar' ? 'ar' : 'en', { hour: '2-digit', minute: '2-digit', })}</span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className={`${styles.message} ${styles.messageAssistant}`}>  
              <span className={styles.messageAvatar}>🤖</span>
              <div className={styles.messageBubble}>  
                <div className={styles.typing}><span /><span /><span /></div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Suggested Questions */}
      {messages.length <= 1 && (
        <div className={styles.suggestions}>
          {SUGGESTED_QUESTIONS.map((q, i) => (
            <button key={i} className={styles.suggestionBtn} onClick={() => sendMessage(locale === 'ar' ? q.ar : q.en)}>
              {locale === 'ar' ? q.ar : q.en}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className={styles.inputWrap}>
        <div className={styles.inputBox}>  
          <textarea ref={inputRef} className={styles.input} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={locale === 'ar' ? 'اكتب رسالتك...' : 'Type your message...'} rows={1} disabled={isLoading} />  
          <button className={styles.sendBtn} onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading} aria-label='Send'>  
            {dir === 'rtl' ? '←' : '→'}
          </button>
        </div>
        <p className={styles.inputHint}>{locale === 'ar' ? 'Enter للإرسال · Shift+Enter لسطر جديد' : 'Enter to send · Shift+Enter for new line'}</p>
      </div>

    </main>
  );
}