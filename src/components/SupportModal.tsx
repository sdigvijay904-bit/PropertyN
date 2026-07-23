/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Bot, User, Check, ShieldCheck, HelpCircle } from 'lucide-react';
import SupportAgentAvatar from './SupportAgentAvatar';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
}

const FAQ_ITEMS = [
  {
    q: 'How do I start earning Daily Income?',
    a: 'Simply browse our Real Estate Property Funds on the Home page, choose an investment tier (such as DLF Luxury Residencies or Urban Smart Studio), click "Purchase Now" and confirm. Your capital is allocated to premium real-estate purchases, and daily rental dividends are credited continuously to your account!'
  },
  {
    q: 'What is the minimum recharge and withdrawal limit?',
    a: 'The minimum recharge is ₹250. The minimum withdrawal is ₹120. Withdrawals are processed instantly to your configured bank account with a standard 5% settlement fee.'
  },
  {
    q: 'How does the 3-Level Referral commission work?',
    a: 'Invite friends via your referral QR or link. Lvl 1 earns 10% on direct property fund purchases. Lvl 2 earns 5% on friends invited by Lvl 1. Lvl 3 earns 2% on friends invited by Lvl 2. Commissions are credited instantly!'
  },
  {
    q: 'Is my bank transfer and payment secure?',
    a: 'Yes, we secure payments using integrated direct UPI merchant gateways. All deposits are verified using UTR receipts and processed directly by our secure real-estate banking partners.'
  }
];

export default function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg_1',
      sender: 'bot',
      text: 'Namaste! Welcome to PropertyN Real-Estate Helpdesk. How can I assist you today? You can select an FAQ below or write your message.',
      time: 'Just now'
    }
  ]);
  const [inputText, setInputText] = useState<string>('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputText.trim();
    if (!text) return;

    if (!textToSend) {
      setInputText('');
    }

    const newUserMsg: Message = {
      id: `msg_u_${Date.now()}`,
      sender: 'user',
      text,
      time: 'Just now'
    };

    setMessages(prev => [...prev, newUserMsg]);

    // Simulate bot replying with customized replies
    setTimeout(() => {
      let botText = "I have received your query. Our support administrator will review your account details and update your transaction status shortly. Thank you for your patience!";
      const lower = text.toLowerCase();

      if (lower.includes('recharge') || lower.includes('payment') || lower.includes('utr') || lower.includes('deposit')) {
        botText = "For recharge issues, please ensure you submitted the correct 12-digit UTR/Txn reference number from your payment app. If you submitted the correct number, please allow up to 3 minutes for automatic blockchain verification.";
      } else if (lower.includes('withdraw') || lower.includes('bank') || lower.includes('money') || lower.includes('transfer')) {
        botText = "Withdrawal requests are processed 24/7. Standard verification takes 30-120 minutes. Please check your profile's Bank Account settings to ensure your IFSC code and Account Number are absolutely correct.";
      } else if (lower.includes('invite') || lower.includes('refer') || lower.includes('commission') || lower.includes('team')) {
        botText = "You earn 10% direct commission on Level 1 friend recharges, 5% on Level 2, and 2% on Level 3. Share your QR code or referral link from the Invite section to start building your passive team income!";
      } else if (lower.includes('plan') || lower.includes('buy') || lower.includes('purchase')) {
        botText = "You can purchase multiple property investment plans to compound your daily yield! The DLF Luxury Residencies Plan yields high-returns (₹4,536 daily) and runs for 2 days. Browse other premium funds on the home page for long-term secure yields.";
      } else if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
        botText = "Hello! I am your automated PropertyN Support Assistant. How can I help you? You can ask about Recharges, Withdrawals, Real Estate Funds, or Referral Commissions.";
      }

      const newBotMsg: Message = {
        id: `msg_b_${Date.now()}`,
        sender: 'bot',
        text: botText,
        time: 'Just now'
      };

      setMessages(prev => [...prev, newBotMsg]);
    }, 1000);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-slate-50 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[85vh]"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 flex items-center justify-between relative">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full border-2 border-white/40 overflow-hidden bg-white/10 shrink-0 shadow-md flex items-center justify-center">
                <SupportAgentAvatar className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-sm font-bold">24/7 Service Desk</h3>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                  <span className="text-[10px] text-emerald-100 font-medium">Support Agent is Online</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Secure Badge */}
          <div className="bg-teal-50 px-4 py-2 border-b border-teal-100 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">Secure SSL Helpdesk Terminal</span>
          </div>

          {/* Chat Panel */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 max-w-[85%] ${
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                    msg.sender === 'user' ? 'bg-teal-600 text-white' : 'bg-white text-emerald-600 border border-emerald-100 shadow-sm'
                  }`}
                >
                  {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className="space-y-1">
                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-tr-none shadow-sm shadow-emerald-100'
                        : 'bg-white text-gray-800 border border-gray-250/60 rounded-tl-none shadow-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <p className="text-[9px] text-gray-400 font-medium px-1 flex items-center gap-1 justify-end">
                    <span>{msg.time}</span>
                    {msg.sender === 'user' && <Check className="w-3 h-3 text-emerald-500" />}
                  </p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Quick FAQ Selector */}
          <div className="px-4 py-2 border-t border-gray-100 bg-white">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>Select Quick FAQ to ask</span>
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x">
              {FAQ_ITEMS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(item.q)}
                  className="shrink-0 snap-center px-3 py-1.5 bg-gray-50 hover:bg-emerald-50 border border-gray-150 rounded-xl text-[11px] font-bold text-gray-600 hover:text-emerald-700 transition-colors"
                >
                  {item.q}
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-gray-150 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your question here..."
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-gray-800"
            />
            <button
              type="button"
              onClick={() => handleSendMessage()}
              className="w-9 h-9 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-md shadow-emerald-100"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
