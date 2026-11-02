import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useChatRooms, useMessages } from '../../hooks/useChat';
import { useAuth } from '../../context/AuthContext';
import { socketService } from '../../services/socketService';

const HingeChatScreen: React.FC = () => {
  const { user } = useAuth();
  const { rooms, isLoading, error, refresh } = useChatRooms();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  // Get messages for selected chat
  const {
    messages,
    sendMessage,
    markAsRead,
    loadMore,
    isLoading: messagesLoading,
  } = useMessages(selectedChat);

  // Connect to socket
  useEffect(() => {
    const connect = async () => {
      try {
        await socketService.connect();
        setConnected(true);
      } catch (error) {
        console.error('Socket connection failed:', error);
      }
    };
    connect();

    return () => {
      socketService.disconnect();
    };
  }, []);

  // Setup socket listeners
  useEffect(() => {
    const unsubscribeMessage = socketService.onNewMessage((data) => {
      // Refresh messages when new message arrives
      if (data.roomId === selectedChat) {
        // In a real app, you'd update the messages list here
      }
    });

    const unsubscribeTyping = socketService.onTyping((data) => {
      // Handle typing indicator
    });

    return () => {
      unsubscribeMessage();
      unsubscribeTyping();
    };
  }, [selectedChat]);

  // Mark as read when opening chat
  useEffect(() => {
    if (selectedChat) {
      markAsRead();
    }
  }, [selectedChat]);

  const handleSendMessage = async (content: string) => {
    if (!selectedChat || !content.trim()) return;
    
    try {
      await sendMessage(content);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes < 10 ? '0' + minutes : minutes;
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  const selectedRoom = rooms.find(r => r.id === selectedChat);

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.warningText}>Please log in to view messages</Text>
      </View>
    );
  }

  // Chat Thread View
  if (selectedChat && selectedRoom) {
    return (
      <ChatThread
        match={selectedRoom}
        messages={messages}
        onBack={() => setSelectedChat(null)}
        onSendMessage={handleSendMessage}
        isLoadingMessages={messagesLoading}
        onLoadMore={loadMore}
      />
    );
  }

  // Chat List View
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Matches & Messages</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Text style={styles.searchIcon}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Connection Status */}
      <View style={styles.connectionBar}>
        <View style={[styles.connectionDot, connected ? styles.connected : styles.disconnected]} />
        <Text style={styles.connectionText}>
          {connected ? 'Connected' : 'Connecting...'}
        </Text>
      </View>

      {/* New Matches Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>New Matches</Text>
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="small" color="#ff6b6b" />
          </View>
        ) : rooms.length === 0 ? (
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>No matches yet</Text>
            <Text style={styles.emptySubtext}>Keep swiping to find your match!</Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.matchesScroll}
            contentContainerStyle={styles.matchesContent}
          >
            {rooms.map((room) => (
              <TouchableOpacity
                key={room.id}
                style={styles.matchItem}
                onPress={() => setSelectedChat(room.id)}
              >
                <View style={styles.photoContainer}>
                  <Image
                    source={{ 
                      uri: JSON.parse(room.user.appProfileData || '{}').avatar 
                        || 'https://via.placeholder.com/70' 
                    }}
                    style={styles.matchPhoto}
                    resizeMode="cover"
                  />
                  {room.status === 'ACCEPTED' && (
                    <View style={styles.onlineIndicator} />
                  )}
                </View>
                <Text style={styles.matchName} numberOfLines={1}>
                  {room.user.name}
                </Text>
                {room.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{room.unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Conversations Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Conversations</Text>
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="small" color="#ff6b6b" />
          </View>
        ) : rooms.length === 0 ? (
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>No conversations</Text>
            <Text style={styles.emptySubtext}>Start chatting with your matches!</Text>
          </View>
        ) : (
          <ScrollView style={styles.conversationsList}>
            {rooms.map((room) => (
              <TouchableOpacity
                key={room.id}
                style={styles.conversationItem}
                onPress={() => setSelectedChat(room.id)}
              >
                <View style={styles.matchItem}>
                  <View style={styles.photoContainer}>
                    <Image
                      source={{ 
                        uri: JSON.parse(room.user.appProfileData || '{}').avatar 
                          || 'https://via.placeholder.com/50' 
                      }}
                      style={styles.matchPhoto}
                      resizeMode="cover"
                    />
                    {room.status === 'ACCEPTED' && (
                      <View style={styles.onlineIndicator} />
                    )}
                  </View>
                  <View style={styles.conversationInfo}>
                    <Text style={styles.matchName}>{room.user.name}</Text>
                    <Text style={styles.lastMessage} numberOfLines={1}>
                      {room.lastMessage || 'Start a conversation!'}
                    </Text>
                  </View>
                </View>
                <View style={styles.messageMeta}>
                  {room.lastMessageTime && (
                    <Text style={styles.timeText}>
                      {formatTime(room.lastMessageTime)}
                    </Text>
                  )}
                  {room.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{room.unreadCount}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.bottomPadding} />
    </View>
  );
};

// Chat Thread Component
const ChatThread: React.FC<{
  match: any;
  messages: any[];
  onBack: () => void;
  onSendMessage: (content: string) => Promise<void>;
  isLoadingMessages: boolean;
  onLoadMore: () => void;
}> = ({ match, messages, onBack, onSendMessage, isLoadingMessages, onLoadMore }) => {
  const [newMessage, setNewMessage] = useState('');
  const scrollViewRef = useRef<React.ElementRef<typeof ScrollView>>(null);

  useEffect(() => {
    // Join the room
    socketService.joinRoom(match.id);
    
    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    return () => {
      socketService.leaveRoom(match.id);
    };
  }, []);

  const handleSend = async () => {
    if (newMessage.trim()) {
      await onSendMessage(newMessage.trim());
      setNewMessage('');
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes < 10 ? '0' + minutes : minutes;
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  return (
    <View style={styles.chatContainer}>
      {/* Chat Header */}
      <View style={styles.chatHeader}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Image
          source={{ 
            uri: JSON.parse(match.user.appProfileData || '{}').avatar 
              || 'https://via.placeholder.com/40' 
          }}
          style={styles.chatHeaderPhoto}
          resizeMode="cover"
        />
        <View style={styles.chatHeaderInfo}>
          <Text style={styles.chatHeaderName}>{match.user.name}</Text>
          <Text style={styles.onlineText}>
            {match.status === 'ACCEPTED' ? 'Online' : 'Offline'}
          </Text>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Text style={styles.moreIcon}>⋯</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        onScrollToTop={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        onMomentumScrollBegin={() => {
          // Load more messages when scrolling up
          if (messages.length > 0) {
            onLoadMore();
          }
        }}
      >
        {isLoadingMessages && messages.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#ff6b6b" />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyChat}>
            <Text style={styles.emptyChatText}>No messages yet</Text>
            <Text style={styles.emptyChatSubtext}>Say hello to {match.user.name}!</Text>
          </View>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isFromMe={message.senderId === match.userId}
              formatTime={formatTime}
            />
          ))
        )}
      </ScrollView>

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachmentButton}>
          <Text style={styles.attachmentIcon}>📎</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#999999"
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={1000}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!newMessage.trim()}
        >
          <Text style={styles.sendIcon}>↑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Message Bubble Component
const MessageBubble: React.FC<{
  message: any;
  isFromMe: boolean;
  formatTime: (dateString: string) => string;
}> = ({ message, isFromMe, formatTime }) => {
  return (
    <View
      style={[
        styles.messageBubble,
        isFromMe ? styles.myMessage : styles.theirMessage,
      ]}
    >
      <Text style={[styles.messageText, isFromMe ? styles.myMessageText : styles.theirMessageText]}>
        {message.content}
      </Text>
      <Text style={[styles.messageTime, isFromMe ? styles.myMessageTime : styles.theirMessageTime]}>
        {formatTime(message.createdAt)}
      </Text>
    </View>
  );
};

export default HingeChatScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  searchButton: {
    padding: 10,
  },
  searchIcon: {
    fontSize: 20,
  },
  connectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#f8f8f8',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connected: {
    backgroundColor: '#4cd964',
  },
  disconnected: {
    backgroundColor: '#ff9500',
  },
  connectionText: {
    fontSize: 12,
    color: '#666666',
  },
  section: {
    marginTop: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  matchesScroll: {
    flex: 1,
  },
  matchesContent: {
    paddingHorizontal: 20,
    gap: 15,
  },
  matchItem: {
    alignItems: 'center',
  },
  photoContainer: {
    position: 'relative',
  },
  matchPhoto: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#ff6b6b',
    padding: 2,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4cd964',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  matchName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginTop: 8,
    maxWidth: 80,
    textAlign: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff6b6b',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  emptySection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
  },
  conversationsList: {
    paddingHorizontal: 20,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  conversationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  lastMessage: {
    fontSize: 14,
    color: '#999999',
    marginTop: 2,
  },
  messageMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#999999',
  },
  bottomPadding: {
    height: 40,
  },
  warningText: {
    fontSize: 18,
    color: '#ff6b6b',
    textAlign: 'center',
  },
  // Chat Thread Styles
  chatContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 10,
    marginLeft: -10,
  },
  backArrow: {
    fontSize: 32,
    color: '#000000',
    fontWeight: '300',
  },
  chatHeaderPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 12,
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatHeaderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  onlineText: {
    fontSize: 12,
    color: '#4cd964',
  },
  moreButton: {
    padding: 10,
  },
  moreIcon: {
    fontSize: 20,
    color: '#666666',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyChatText: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 8,
  },
  emptyChatSubtext: {
    fontSize: 14,
    color: '#999999',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    marginBottom: 10,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#ff6b6b',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  myMessageText: {
    color: '#ffffff',
  },
  theirMessageText: {
    color: '#000000',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  theirMessageTime: {
    color: '#999999',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  attachmentButton: {
    padding: 10,
  },
  attachmentIcon: {
    fontSize: 24,
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    minHeight: 44,
    maxHeight: 120,
    fontSize: 16,
    color: '#000000',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ff6b6b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  sendIcon: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '300',
  },
});
