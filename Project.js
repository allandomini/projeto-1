import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  Animated,
  Easing,
  Alert,
  ScrollView,
  Modal,
  Image,
  PanResponder,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// Get screen dimensions
const { width, height } = Dimensions.get('window');

// Card default dimensions
const CARD_DEFAULT_WIDTH = width * 0.9; // 90% of screen width for mobile
const CARD_DEFAULT_HEIGHT = 200;

const ProjectScreen = ({ project, goBack, updateProject }) => {
  const [cards, setCards] = useState(project.cards || []);
  const [addCardModalVisible, setAddCardModalVisible] = useState(false);
  const [selectedCardType, setSelectedCardType] = useState(null);
  const [newNote, setNewNote] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageCaption, setImageCaption] = useState('');
  const [todoModalVisible, setTodoModalVisible] = useState(false);
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [financialModalVisible, setFinancialModalVisible] = useState(false);
  const [todoTasks, setTodoTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [activeCardId, setActiveCardId] = useState(null);
  const [noteFormatting, setNoteFormatting] = useState({
    bold: false,
    italic: false,
    list: false
  });
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskText, setEditingTaskText] = useState('');
  const [financialData, setFinancialData] = useState({
    title: 'Finanças',
    balance: 0,
    transactions: []
  });
  const [editingCard, setEditingCard] = useState(null);
  const [showAddCardSidebar, setShowAddCardSidebar] = useState(false);
  const sidebarAnimation = useRef(new Animated.Value(200)).current;
  const [draggedCardIndex, setDraggedCardIndex] = useState(null);
  const draggedY = useRef(new Animated.Value(0)).current;
  const cardRefs = useRef([]);

  // Reference for ScrollView
  const scrollViewRef = useRef(null);
  const contentSize = useRef({ height: height * 2 });

  // Add at the beginning of the ProjectScreen component
  const lastTapTimesRef = useRef({});

  // Initialize modal editing states
  const [modalEditingTaskId, setModalEditingTaskId] = useState(null);
  const [modalEditingTaskText, setModalEditingTaskText] = useState('');

  // Function to choose image from gallery
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  // Apply formatting to note text
  const applyFormatting = (type) => {
    setNoteFormatting({
      ...noteFormatting,
      [type]: !noteFormatting[type]
    });
  };

  // Edit card function
  const editCard = (card) => {
    setEditingCard(card);
    switch (card.type) {
      case 'todo':
        setTodoModalVisible(true);
        setTodoTasks(card.tasks || []);
        break;
      case 'note':
        setNotesModalVisible(true);
        setNewNote(card.content || '');
        setNoteFormatting(card.formatting || { bold: false, italic: false, list: false });
        break;
      case 'image':
        setImageModalVisible(true);
        setSelectedImage(card.imageUri || null);
        setImageCaption(card.caption || '');
        break;
      case 'financial':
        setFinancialModalVisible(true);
        setFinancialData(card.data || { title: 'Finanças', balance: 0, transactions: [] });
        break;
    }
    setActiveCardId(null);
  };

  // Save card (for new or edited cards)
  const saveCard = (type) => {
    let updatedCard;
    switch (type) {
      case 'todo':
        updatedCard = {
          id: editingCard ? editingCard.id : Date.now().toString(),
          type: 'todo',
          title: 'Tarefas',
          tasks: todoTasks,
          order: editingCard ? editingCard.order : cards.length // preserve or assign order
        };
        setTodoModalVisible(false);
        break;
      case 'note':
        if (newNote.trim() === '') {
          Alert.alert('Erro', 'Digite algo na nota');
          return;
        }
        updatedCard = {
          id: editingCard ? editingCard.id : Date.now().toString(),
          type: 'note',
          content: newNote,
          formatting: noteFormatting,
          order: editingCard ? editingCard.order : cards.length // preserve or assign order
        };
        setNewNote('');
        setNoteFormatting({ bold: false, italic: false, list: false });
        setNotesModalVisible(false);
        break;
      case 'image':
        if (!selectedImage) {
          Alert.alert('Erro', 'Selecione uma imagem');
          return;
        }
        updatedCard = {
          id: editingCard ? editingCard.id : Date.now().toString(),
          type: 'image',
          imageUri: selectedImage,
          caption: imageCaption,
          order: editingCard ? editingCard.order : cards.length // preserve or assign order
        };
        setSelectedImage(null);
        setImageCaption('');
        setImageModalVisible(false);
        break;
      case 'financial':
        updatedCard = {
          id: editingCard ? editingCard.id : Date.now().toString(),
          type: 'financial',
          title: 'Finanças',
          data: financialData,
          order: editingCard ? editingCard.order : cards.length // preserve or assign order
        };
        setFinancialModalVisible(false);
        break;
      default:
        return;
    }

    if (editingCard) {
      const updatedCards = cards.map(c => (c.id === editingCard.id ? updatedCard : c));
      setCards(updatedCards);
    } else {
      setCards([...cards, updatedCard]);
    }
    setSelectedCardType(null);
    setAddCardModalVisible(false);
    setEditingCard(null);
  };

  // Delete card
  const deleteCard = (id) => {
    const updatedCards = cards.filter(card => card.id !== id);
    
    // Reorder remaining cards after deletion
    const reorderedCards = updatedCards.map((card, index) => ({
      ...card,
      order: index
    }));
    
    setCards(reorderedCards);
    setActiveCardId(null);
  };

  // Add task to temporary task list
  const addTodoTask = () => {
    if (newTask.trim() === '') {
      Alert.alert('Erro', 'Digite uma tarefa para adicionar');
      return;
    }

    const newTaskObj = {
      id: Date.now().toString(),
      text: newTask,
      completed: false
    };

    setTodoTasks([...todoTasks, newTaskObj]);
    setNewTask('');
  };

  // Add task to an existing card
  const addTaskToCard = (cardId, taskText) => {
    if (taskText.trim() === '') {
      return;
    }

    const newTaskObj = {
      id: Date.now().toString(),
      text: taskText,
      completed: false
    };

    const updatedCards = cards.map(card => {
      if (card.id === cardId) {
        return {
          ...card,
          tasks: [...(card.tasks || []), newTaskObj]
        };
      }
      return card;
    });

    setCards(updatedCards);
    setNewTask('');
  };

  // Remove task from a card
  const removeTaskFromCard = (cardId, taskId) => {
    const updatedCards = cards.map(card => {
      if (card.id === cardId) {
        return {
          ...card,
          tasks: card.tasks.filter(task => task.id !== taskId)
        };
      }
      return card;
    });

    setCards(updatedCards);
  };

  // Update task in a card
  const updateTaskInCard = (cardId, taskId, newText) => {
    if (newText.trim() === '') {
      Alert.alert('Erro', 'A tarefa não pode estar vazia');
      return;
    }

    const updatedCards = cards.map(card => {
      if (card.id === cardId) {
        return {
          ...card,
          tasks: card.tasks.map(task => 
            task.id === taskId ? { ...task, text: newText } : task
          )
        };
      }
      return card;
    });

    setCards(updatedCards);
    setEditingTaskId(null);
    setEditingTaskText('');
  };

  // Toggle task completion status
  const toggleTaskComplete = (cardId, taskId) => {
    const updatedCards = cards.map(card => {
      if (card.id === cardId) {
        return {
          ...card,
          tasks: card.tasks.map(task => 
            task.id === taskId ? { ...task, completed: !task.completed } : task
          )
        };
      }
      return card;
    });

    setCards(updatedCards);
  };

  // Add financial transaction
  const addTransaction = () => {
    if (newTransaction.description.trim() === '' || newTransaction.amount.trim() === '') {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    const amount = parseFloat(newTransaction.amount);
    if (isNaN(amount)) {
      Alert.alert('Erro', 'Digite um valor válido');
      return;
    }

    const transaction = {
      id: Date.now().toString(),
      description: newTransaction.description,
      amount: newTransaction.type === 'income' ? amount : -amount,
      date: new Date().toISOString(),
    };

    const updatedTransactions = [...financialData.transactions, transaction];
    const updatedBalance = updatedTransactions.reduce((sum, t) => sum + t.amount, 0);

    setFinancialData({
      ...financialData,
      transactions: updatedTransactions,
      balance: updatedBalance
    });

    setNewTransaction({
      description: '',
      amount: '',
      type: 'expense'
    });
  };
const [newTransaction, setNewTransaction] = useState({
  description: '',
  amount: '',
  type: 'expense'
});
  // Handle double-tap
  const handleDoubleTap = (cardId) => {
    const now = Date.now();
    const lastTap = lastTapTimesRef.current[cardId] || 0;
    
    if (now - lastTap < 300) {
      setActiveCardId(cardId);
      lastTapTimesRef.current[cardId] = 0; // Reset to avoid multiple triggers
    } else {
      lastTapTimesRef.current[cardId] = now;
    }
  };

  // Move card up in order
  const moveCardUp = (index) => {
    if (index <= 0) return;
    
    const updatedCards = [...cards];
    [updatedCards[index], updatedCards[index - 1]] = [updatedCards[index - 1], updatedCards[index]];
    
    // Update order property for each card
    const reorderedCards = updatedCards.map((card, idx) => ({
      ...card,
      order: idx
    }));
    
    setCards(reorderedCards);
  };

  // Move card down in order
  const moveCardDown = (index) => {
    if (index >= cards.length - 1) return;
    
    const updatedCards = [...cards];
    [updatedCards[index], updatedCards[index + 1]] = [updatedCards[index + 1], updatedCards[index]];
    
    // Update order property for each card
    const reorderedCards = updatedCards.map((card, idx) => ({
      ...card,
      order: idx
    }));
    
    setCards(reorderedCards);
  };

  // Update project when cards change
  useEffect(() => {
    const updatedProject = {
      ...project,
      cards: cards
    };
    updateProject(updatedProject);
  }, [cards]);

  // Sidebar animation
  useEffect(() => {
    if (showAddCardSidebar) {
      Animated.timing(sidebarAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(sidebarAnimation, {
        toValue: 200,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showAddCardSidebar]);

  // Render each card based on type
  const renderCard = ({ item, index }) => {
    let cardContent;
    let cardStyle = {};
    
    switch (item.type) {
      case 'todo':
        const totalTasks = item.tasks?.length || 0;
        const completedTasks = item.tasks?.filter(t => t.completed).length || 0;
        const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(0) : 0;

        cardContent = (
          <View style={styles.todoCardContent}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.title}</Text>
            </View>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{totalTasks}</Text>
                <Text style={styles.statLabel}>Tarefas</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{completedTasks}</Text>
                <Text style={styles.statLabel}>Concluídas</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{completionPercentage}%</Text>
                <Text style={styles.statLabel}>Completo</Text>
              </View>
            </View>
            
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${completionPercentage}%` }]} />
            </View>
            
            <ScrollView style={styles.todoList} nestedScrollEnabled={true}>
              {item.tasks && item.tasks.map(task => (
                <View key={task.id} style={styles.todoItem}>
                  {editingTaskId === task.id ? (
                    // Edit mode
                    <View style={styles.editTaskContainer}>
                      <TextInput
                        style={styles.editTaskInput}
                        value={editingTaskText}
                        onChangeText={setEditingTaskText}
                        autoFocus
                      />
                      <View style={styles.editTaskButtons}>
                        <TouchableOpacity 
                          onPress={() => {
                            setEditingTaskId(null);
                            setEditingTaskText('');
                          }}
                          style={styles.cancelEditTaskButton}
                        >
                          <MaterialIcons name="close" size={18} color="#F44336" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          onPress={() => updateTaskInCard(item.id, task.id, editingTaskText)}
                          style={styles.confirmEditTaskButton}
                        >
                          <MaterialIcons name="check" size={18} color="#4DC25A" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    // Normal view
                    <>
                      <TouchableOpacity 
                        onPress={() => toggleTaskComplete(item.id, task.id)}
                        style={styles.todoCheckbox}
                      >
                        <MaterialIcons
                          name={task.completed ? "check-box" : "check-box-outline-blank"}
                          size={20}
                          color={task.completed ? "#4DC25A" : "#757575"}
                        />
                      </TouchableOpacity>
                      
                      <Text style={[
                        styles.todoText,
                        task.completed && styles.todoCompleted
                      ]}>
                        {task.text}
                      </Text>
                      
                      <View style={styles.todoActions}>
                        <TouchableOpacity 
                          onPress={() => {
                            setEditingTaskId(task.id);
                            setEditingTaskText(task.text);
                          }}
                          style={styles.editTaskButton}
                        >
                          <MaterialIcons name="edit" size={18} color="#4DC25A" />
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          onPress={() => removeTaskFromCard(item.id, task.id)}
                          style={styles.deleteTaskButton}
                        >
                          <MaterialIcons name="delete" size={18} color="#F44336" />
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </View>
              ))}
            </ScrollView>
            
            <View style={styles.addTaskContainer}>
              <TextInput
                style={styles.addTaskInput}
                placeholder="Nova tarefa..."
                value={newTask}
                onChangeText={setNewTask}
                onSubmitEditing={() => addTaskToCard(item.id, newTask)}
              />
              <TouchableOpacity 
                style={styles.addTaskButton}
                onPress={() => addTaskToCard(item.id, newTask)}
              >
                <MaterialIcons name="add" size={20} color="#4DC25A" />
              </TouchableOpacity>
            </View>
          </View>
        );
        cardStyle = styles.todoCard;
        break;
        
      case 'note':
        const formatted = item.formatting || {};
        cardContent = (
          <View style={styles.noteCardContent}>
            <Text 
              style={[
                styles.noteText,
                formatted.bold && styles.boldText,
                formatted.italic && styles.italicText,
                formatted.list && styles.listText
              ]}
            >
              {item.content}
            </Text>
          </View>
        );
        cardStyle = styles.noteCard;
        break;
        
      case 'image':
        cardContent = (
          <View style={styles.imageCardContent}>
            <Image source={{ uri: item.imageUri }} style={styles.cardImage} />
            {item.caption && (
              <Text style={styles.imageCaption}>{item.caption}</Text>
            )}
          </View>
        );
        cardStyle = styles.imageCard;
        break;
        
      case 'financial':
        cardContent = (
          <View style={styles.financialCardContent}>
            <Text style={styles.cardTitle}>{item.data?.title || 'Finanças'}</Text>
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceLabel}>Saldo:</Text>
              <Text style={[
                styles.balanceValue,
                (item.data?.balance || 0) >= 0 ? styles.positiveBalance : styles.negativeBalance
              ]}>
                R$ {Math.abs(item.data?.balance || 0).toFixed(2)}
              </Text>
            </View>
            <ScrollView style={styles.transactionsList} nestedScrollEnabled={true}>
              {item.data?.transactions?.slice(0, 3).map(transaction => (
                <View key={transaction.id} style={styles.transactionItem}>
                  <Text style={styles.transactionDescription}>{transaction.description}</Text>
                  <Text style={[
                    styles.transactionAmount,
                    transaction.amount >= 0 ? styles.positiveAmount : styles.negativeAmount
                  ]}>
                    R$ {Math.abs(transaction.amount).toFixed(2)}
                  </Text>
                </View>
              ))}
              {item.data?.transactions?.length > 3 && (
                <Text style={styles.moreTransactions}>
                  +{item.data.transactions.length - 3} mais transações...
                </Text>
              )}
            </ScrollView>
          </View>
        );
        cardStyle = styles.financialCard;
        break;
        
      default:
        cardContent = <Text>Card desconhecido</Text>;
    }

    return (
      <TouchableOpacity 
        ref={ref => cardRefs.current[index] = ref}
        onPress={() => handleDoubleTap(item.id)} 
        activeOpacity={1}
        style={[styles.verticalCard, cardStyle]}
      >
        {activeCardId === item.id && (
          <View style={styles.cardOptionsMenu}>
            <TouchableOpacity 
              style={styles.cardOption} 
              onPress={() => editCard(item)}
            >
              <MaterialIcons name="edit" size={20} color="#4DC25A" />
              <Text style={styles.cardOptionText}>Editar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cardOption} 
              onPress={() => deleteCard(item.id)}
            >
              <MaterialIcons name="delete" size={20} color="#F44336" />
              <Text style={styles.cardOptionText}>Excluir</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Card re-order buttons */}
        <View style={styles.cardOrderButtons}>
          <TouchableOpacity
            style={styles.orderButton}
            onPress={() => moveCardUp(index)}
            disabled={index === 0}
          >
            <MaterialIcons 
              name="arrow-upward" 
              size={16} 
              color={index === 0 ? "#CCCCCC" : "#666666"} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.orderButton}
            onPress={() => moveCardDown(index)}
            disabled={index === cards.length - 1}
          >
            <MaterialIcons 
              name="arrow-downward" 
              size={16} 
              color={index === cards.length - 1 ? "#CCCCCC" : "#666666"} 
            />
          </TouchableOpacity>
        </View>
        
        {cardContent}
      </TouchableOpacity>
    );
  };

  // Sort cards by order
  const sortedCards = [...cards].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <View style={[styles.container, { backgroundColor: project.color }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.projectTitle}>{project.name}</Text>
      </View>

      {/* Main content area with vertical scrolling */}
      <FlatList
        data={sortedCards}
        renderItem={renderCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.cardListContainer}
        onPress={() => setActiveCardId(null)}
        showsVerticalScrollIndicator={true}
      />

      {/* Add card button */}
      <TouchableOpacity
        style={styles.addCardButton}
        onPress={() => setShowAddCardSidebar(true)}
      >
        <MaterialIcons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Add card sidebar */}
      {showAddCardSidebar && (
        <Animated.View style={[styles.addCardSidebar, { transform: [{ translateX: sidebarAnimation }] }]}>
          <TouchableOpacity onPress={() => setShowAddCardSidebar(false)} style={styles.sidebarCloseButton}>
            <MaterialIcons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.sidebarTitle}>Adicionar Card</Text>
          <TouchableOpacity style={styles.cardTypeOption} onPress={() => {
            setShowAddCardSidebar(false);
            setTodoModalVisible(true);
            setTodoTasks([]);
          }}>
            <MaterialIcons name="check-box" size={24} color="#4DC25A" />
            <Text style={styles.cardTypeText}>Lista de Tarefas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cardTypeOption} onPress={() => {
            setShowAddCardSidebar(false);
            setNotesModalVisible(true);
          }}>
            <MaterialIcons name="notes" size={24} color="#FF9800" />
            <Text style={styles.cardTypeText}>Bloco de Notas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cardTypeOption} onPress={() => {
            setShowAddCardSidebar(false);
            setImageModalVisible(true);
          }}>
            <MaterialIcons name="image" size={24} color="#2196F3" />
            <Text style={styles.cardTypeText}>Upload de Imagem</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cardTypeOption} onPress={() => {
            setShowAddCardSidebar(false);
            setFinancialModalVisible(true);
            setFinancialData({ title: 'Finanças', balance: 0, transactions: [] });
          }}>
            <MaterialIcons name="account-balance-wallet" size={24} color="#9C27B0" />
            <Text style={styles.cardTypeText}>Financeiro</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Modal for creating task list */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={todoModalVisible}
        onRequestClose={() => setTodoModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoidingContainer}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Nova Lista de Tarefas</Text>
              
              <View style={styles.todoContainer}>
                <FlatList
                  data={todoTasks}
                  keyExtractor={item => item.id}
                  renderItem={({ item }) => {
                    if (item.id === modalEditingTaskId) {
                      return (
                        <View style={styles.editTaskContainer}>
                          <TextInput
                            style={styles.editTaskInput}
                            value={modalEditingTaskText}
                            onChangeText={setModalEditingTaskText}
                            autoFocus
                          />
                          <View style={styles.editTaskButtons}>
                            <TouchableOpacity
                              onPress={() => {
                                setModalEditingTaskId(null);
                                setModalEditingTaskText('');
                              }}
                              style={styles.cancelEditTaskButton}
                            >
                              <MaterialIcons name="close" size={18} color="#F44336" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => {
                                const updatedTasks = todoTasks.map(t =>
                                  t.id === item.id ? { ...t, text: modalEditingTaskText } : t
                                );
                                setTodoTasks(updatedTasks);
                                setModalEditingTaskId(null);
                                setModalEditingTaskText('');
                              }}
                              style={styles.confirmEditTaskButton}
                            >
                              <MaterialIcons name="check" size={18} color="#4DC25A" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    }
                    return (
                      <View style={styles.todoItem}>
                        <MaterialIcons name="check-box-outline-blank" size={20} color="#757575" />
                        <Text style={styles.todoText}>{item.text}</Text>
                        <View style={styles.todoActions}>
                          <TouchableOpacity
                            onPress={() => {
                              setModalEditingTaskId(item.id);
                              setModalEditingTaskText(item.text);
                            }}
                            style={styles.editTaskButton}
                          >
                            <MaterialIcons name="edit" size={18} color="#4DC25A" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => {
                              const updatedTasks = todoTasks.filter(t => t.id !== item.id);
                              setTodoTasks(updatedTasks);
                            }}
                            style={styles.deleteTaskButton}
                          >
                            <MaterialIcons name="delete" size={18} color="#F44336" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  }}
                  style={styles.todoModalList}
                  ListEmptyComponent={<Text style={styles.emptyListText}>Adicione tarefas abaixo</Text>}
                />
                
                <View style={styles.addTodoContainer}>
                  <TextInput
                    style={styles.todoInput}
                    placeholder="Nova tarefa..."
                    value={newTask}
                    onChangeText={setNewTask}
                  />
                  <TouchableOpacity style={styles.addTodoButton} onPress={addTodoTask}>
                    <MaterialIcons name="add" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setTodoModalVisible(false)}
                >
                  <Text style={styles.buttonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.createButton]}
                  onPress={() => saveCard('todo')}
                >
                  <Text style={styles.createButtonText}>{editingCard ? 'Salvar' : 'Criar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
      
      {/* Modal for creating note */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={notesModalVisible}
        onRequestClose={() => setNotesModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoidingContainer}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Novo Bloco de Notas</Text>
              
              <View style={styles.formattingToolbar}>
                <TouchableOpacity 
                  style={[
                    styles.formattingButton,
                    noteFormatting.bold && styles.activeFormattingButton
                  ]}
                  onPress={() => applyFormatting('bold')}
                >
                  <MaterialIcons name="format-bold" size={22} color={noteFormatting.bold ? "#4DC25A" : "#666"} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.formattingButton,
                    noteFormatting.italic && styles.activeFormattingButton
                  ]}
                  onPress={() => applyFormatting('italic')}
                >
                  <MaterialIcons name="format-italic" size={22} color={noteFormatting.italic ? "#4DC25A" : "#666"} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.formattingButton,
                    noteFormatting.list && styles.activeFormattingButton
                  ]}
                  onPress={() => applyFormatting('list')}
                >
                  <MaterialIcons name="format-list-bulleted" size={22} color={noteFormatting.list ? "#4DC25A" : "#666"} />
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={[
                  styles.noteInput,
                  noteFormatting.bold && styles.boldText,
                  noteFormatting.italic && styles.italicText
                ]}
                placeholder="Digite sua nota aqui..."
                multiline
                value={newNote}
                onChangeText={setNewNote}
              />
              
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setNotesModalVisible(false);
                    setNoteFormatting({ bold: false, italic: false, list: false });
                  }}
                >
                  <Text style={styles.buttonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.createButton]}
                  onPress={() => saveCard('note')}
                >
                  <Text style={styles.createButtonText}>
                    {editingCard ? 'Salvar' : 'Criar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
      
      {/* Modal for image upload */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={imageModalVisible}
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoidingContainer}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Adicionar Imagem</Text>
              
              <TouchableOpacity 
                style={styles.imagePicker}
                onPress={pickImage}
              >
                {selectedImage ? (
                  <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                ) : (
                  <View style={styles.imagePickerPlaceholder}>
                    <MaterialIcons name="add-photo-alternate" size={40} color="#aaa" />
                    <Text style={styles.imagePickerText}>Toque para selecionar</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              <TextInput
                style={styles.captionInput}
                placeholder="Legenda (opcional)"
                value={imageCaption}
                onChangeText={setImageCaption}
              />
              
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setImageModalVisible(false)}
                >
                  <Text style={styles.buttonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.createButton]}
                  onPress={() => saveCard('image')}
                >
                  <Text style={styles.createButtonText}>
                    {editingCard ? 'Salvar' : 'Adicionar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
      
      {/* Modal for financial card */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={financialModalVisible}
        onRequestClose={() => setFinancialModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoidingContainer}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Financeiro</Text>
              
              <View style={styles.financialContainer}>
                <View style={styles.balanceInfo}>
                  <Text style={styles.balanceLabel}>Saldo: </Text>
                  <Text style={[
                    styles.balanceValue,
                    financialData.balance >= 0 ? styles.positiveBalance : styles.negativeBalance
                  ]}>
                    R$ {Math.abs(financialData.balance).toFixed(2)}
                  </Text>
                </View>
                
                <View style={styles.addTransactionContainer}>
                  <TextInput
                    style={styles.transactionInput}
                    placeholder="Descrição"
                    value={newTransaction.description}
                    onChangeText={(text) => setNewTransaction({...newTransaction, description: text})}
                  />
                  
                  <TextInput
                    style={styles.transactionInput}
                    placeholder="Valor"
                    keyboardType="numeric"
                    value={newTransaction.amount}
                    onChangeText={(text) => setNewTransaction({...newTransaction, amount: text})}
                  />
                  
                  <View style={styles.transactionTypeContainer}>
                    <TouchableOpacity
                      style={[
                        styles.transactionTypeButton,
                        newTransaction.type === 'expense' && styles.activeTransactionType,
                        { backgroundColor: 'rgba(244, 67, 54, 0.1)' }
                      ]}
                      onPress={() => setNewTransaction({...newTransaction, type: 'expense'})}
                    >
                      <MaterialIcons name="arrow-downward" size={20} color="#F44336" />
                      <Text style={styles.transactionTypeText}>Despesa</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.transactionTypeButton,
                        newTransaction.type === 'income' && styles.activeTransactionType,
                        { backgroundColor: 'rgba(76, 175, 80, 0.1)' }
                      ]}
                      onPress={() => setNewTransaction({...newTransaction, type: 'income'})}
                    >
                      <MaterialIcons name="arrow-upward" size={20} color="#4CAF50" />
                      <Text style={styles.transactionTypeText}>Receita</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.addTransactionButton}
                    onPress={addTransaction}
                  >
                    <Text style={styles.addTransactionText}>Adicionar Transação</Text>
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.transactionsList} nestedScrollEnabled={true}>
                  {financialData.transactions.map(transaction => (
                    <View key={transaction.id} style={styles.transactionItem}>
                      <Text style={styles.transactionDescription}>{transaction.description}</Text>
                      <Text style={[
                        styles.transactionAmount,
                        transaction.amount >= 0 ? styles.positiveAmount : styles.negativeAmount
                      ]}>
                        R$ {Math.abs(transaction.amount).toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
              
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setFinancialModalVisible(false)}
                >
                  <Text style={styles.buttonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.createButton]}
                  onPress={() => saveCard('financial')}
                >
                  <Text style={styles.createButtonText}>
                    {editingCard ? 'Salvar' : 'Criar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  projectTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 15,
    color: '#333',
  },
  // Vertical card list styles
  cardListContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100, // Extra space at bottom
  },
  verticalCard: {
    width: CARD_DEFAULT_WIDTH,
    minHeight: CARD_DEFAULT_HEIGHT,
    borderRadius: 12,
    padding: 15,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    alignSelf: 'center',
    position: 'relative',
  },
  // Add card button
  addCardButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4DC25A',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    zIndex: 100,
  },
  // Card options menu
  cardOptionsMenu: {
    position: 'absolute',
    top: -40,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 200,
    flexDirection: 'row',
  },
  cardOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    marginHorizontal: 4,
  },
  cardOptionText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  // Card order buttons
  cardOrderButtons: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'column',
    zIndex: 5,
  },
  orderButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  // Card header
  cardHeader: {
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  // Todo card
  todoCard: {
    backgroundColor: 'white',
  },
  todoCardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  todoList: {
    maxHeight: 200,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  todoCheckbox: {
    marginRight: 10,
  },
  todoText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  todoCompleted: {
    textDecorationLine: 'line-through',
    color: '#9e9e9e',
  },
  todoActions: {
    flexDirection: 'row',
  },
  editTaskButton: {
    padding: 5,
    marginRight: 5,
  },
  deleteTaskButton: {
    padding: 5,
  },
  // Task editing
  editTaskContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editTaskInput: {
    flex: 1,
    height: 36,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 4,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#333',
    marginRight: 10,
  },
  editTaskButtons: {
    flexDirection: 'row',
  },
  cancelEditTaskButton: {
    padding: 5,
    marginRight: 5,
  },
  confirmEditTaskButton: {
    padding: 5,
  },
  addTaskContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  addTaskInput: {
    flex: 1,
    height: 36,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 18,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#333',
    marginRight: 10,
  },
  addTaskButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(77, 194, 90, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Note card
  noteCard: {
    backgroundColor: '#FFF9C4', // Pale yellow for notes
  },
  noteCardContent: {
    flex: 1,
  },
  noteText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  // Text formatting
  boldText: {
    fontWeight: 'bold',
  },
  italicText: {
    fontStyle: 'italic',
  },
  listText: {
    paddingLeft: 15,
  },
  // Image card
  imageCard: {
    backgroundColor: 'white',
    padding: 10,
  },
  imageCardContent: {
    flex: 1,
    alignItems: 'center',
  },
  cardImage: {
    width: '100%',
    height: 150,
    borderRadius: 6,
    marginBottom: 5,
  },
  imageCaption: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  // Financial card
  financialCard: {
    backgroundColor: 'white',
  },
  financialCardContent: {
    flex: 1,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  positiveBalance: {
    color: '#4CAF50',
  },
  negativeBalance: {
    color: '#F44336',
  },
  transactionsList: {
    maxHeight: 120,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionDescription: {
    fontSize: 12,
    color: '#333',
    flex: 1,
  },
  transactionAmount: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  positiveAmount: {
    color: '#4CAF50',
  },
  negativeAmount: {
    color: '#F44336',
  },
  moreTransactions: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
    fontStyle: 'italic',
  },
  // Modals
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  keyboardAvoidingContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  cardTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cardTypeText: {
    fontSize: 16,
    marginLeft: 15,
    color: '#333',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginHorizontal: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  createButton: {
    backgroundColor: '#4DC25A',
  },
  buttonText: {
    fontSize: 16,
    color: '#666',
  },
  createButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  // Todo modal
  todoContainer: {
    width: '100%',
    maxHeight: 300,
  },
  todoModalList: {
    maxHeight: 200,
    width: '100%',
    marginBottom: 10,
  },
  emptyListText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
    fontStyle: 'italic',
  },
  addTodoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  todoInput: {
    flex: 1,
    height: 45,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 25,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  addTodoButton: {
    width: 45,
    height: 45,
    backgroundColor: '#4DC25A',
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Text formatting toolbar
  formattingToolbar: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 15,
    padding: 5,
    alignSelf: 'flex-start',
  },
  formattingButton: {
    padding: 8,
    marginHorizontal: 5,
    borderRadius: 4,
  },
  activeFormattingButton: {
    backgroundColor: 'rgba(77, 194, 90, 0.1)',
  },
  // Note modal
  noteInput: {
    width: '100%',
    height: 200,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 10,
    textAlignVertical: 'top',
  },
  // Image modal
  imagePicker: {
    width: '100%',
    height: 200,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
  },
  imagePickerPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  imagePickerText: {
    marginTop: 10,
    color: '#999',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  captionInput: {
    width: '100%',
    height: 45,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 25,
    paddingHorizontal: 15,
    marginTop: 10,
  },
  // Financial modal
  financialContainer: {
    width: '100%',
  },
  balanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  addTransactionContainer: {
    width: '100%',
    marginBottom: 20,
  },
  transactionInput: {
    width: '100%',
    height: 45,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 25,
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  transactionTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  transactionTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 25,
    width: '48%',
  },
  activeTransactionType: {
    borderWidth: 2,
  },
  transactionTypeText: {
    marginLeft: 5,
    fontSize: 14,
  },
  addTransactionButton: {
    backgroundColor: '#2196F3',
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  addTransactionText: {
    color: 'white',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    marginBottom: 10,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    marginBottom: 15,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4DC25A',
    borderRadius: 2,
  },
  completedTask: {
    backgroundColor: 'rgba(77, 194, 90, 0.05)',
  },
  addCardSidebar: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 200,
    backgroundColor: 'white',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: -2,
      height: 0
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  sidebarCloseButton: {
    alignSelf: 'flex-end',
    padding: 10,
    marginBottom: 5,
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    marginTop: 10,
  },
});

export default ProjectScreen;