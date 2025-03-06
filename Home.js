import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  FlatList,
  Alert,
  StatusBar,
  Animated,
  Easing,
  Image,
  Modal,
  ScrollView,
  TouchableWithoutFeedback
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import ProjectScreen from './Project';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';

export default function Home({ route, navigation }) {
  const [task, setTask] = useState('');
  const [tasks, setTasks] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [selectedColor, setSelectedColor] = useState('#E8F5E9');
  const [showProjectScreen, setShowProjectScreen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [newReminder, setNewReminder] = useState('');
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [reminderDate, setReminderDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const animationValues = useRef({});
  const progressAnimations = useRef({});
  const [editingReminderId, setEditingReminderId] = useState(null);
  const [editingReminderText, setEditingReminderText] = useState('');
  const [editingReminderDate, setEditingReminderDate] = useState(new Date());
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [tempUserName, setTempUserName] = useState('');
  const [tempUserAvatar, setTempUserAvatar] = useState('');
  const [habits, setHabits] = useState([]);
  const [habitModalVisible, setHabitModalVisible] = useState(false);
  const [habitName, setHabitName] = useState('');
  const [habitPriority, setHabitPriority] = useState('medium');
  const [editingHabit, setEditingHabit] = useState(null);

  // Cores disponíveis para os projetos
  const projectColors = [
    '#F5F5F5', // Cinza claro
    '#E8F5E9', // Verde claro (padrão)
    '#E3F2FD', // Azul claro
    '#FFF9C4', // Amarelo claro
    '#FFEBEE', // Vermelho claro
    '#F3E5F5', // Roxo claro
    '#E0F7FA', // Ciano claro
    '#FFF3E0'  // Laranja claro
  ];

  // Calcular estatísticas de tarefas
  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Carregar dados do AsyncStorage quando o app iniciar
  useEffect(() => {
    loadTasks();
    loadProjects();
    loadReminders();
    loadHabits();
  }, []);

  // Salvar tarefas no AsyncStorage sempre que mudar
  useEffect(() => {
    saveTasks();
  }, [tasks]);

  // Salvar projetos no AsyncStorage sempre que mudar
  useEffect(() => {
    saveProjects();
  }, [projects]);

  // Salvar lembretes no AsyncStorage sempre que mudar
  useEffect(() => {
    saveReminders();
  }, [reminders]);

  // Adicionar useEffect para carregar dados do usuário
  useEffect(() => {
    const loadUserData = async () => {
      const loggedInUser = await AsyncStorage.getItem('@loggedInUser');
      if (loggedInUser) {
        const user = JSON.parse(loggedInUser);
        setUserName(user.username);
        setUserAvatar(user.avatar);
        setTempUserName(user.username);
        setTempUserAvatar(user.avatar);
      } else if (route?.params?.user) {
        const user = route.params.user;
        setUserName(user.username);
        setUserAvatar(user.avatar);
        setTempUserName(user.username);
        setTempUserAvatar(user.avatar);
      }
    };
    loadUserData();
  }, [route?.params]);

  // Adicione estes useEffects junto com os outros
  useEffect(() => {
    saveHabits();
  }, [habits]);

  // Adicione o useEffect para verificação diária dos hábitos
  useEffect(() => {
    const checkHabitsDaily = () => {
      const today = new Date().setHours(0, 0, 0, 0);
      
      setHabits(currentHabits => 
        currentHabits.map(habit => {
          if (habit.lastCompleted && new Date(habit.lastCompleted).setHours(0, 0, 0, 0) < today) {
            return { ...habit, completed: false };
          }
          return habit;
        })
      );
    };
    
    checkHabitsDaily();
    
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = midnight.getTime() - new Date().getTime();
    
    const midnightTimeout = setTimeout(() => {
      checkHabitsDaily();
      const dailyInterval = setInterval(checkHabitsDaily, 24 * 60 * 60 * 1000);
      return () => clearInterval(dailyInterval);
    }, msUntilMidnight);
    
    return () => clearTimeout(midnightTimeout);
  }, []);

  // Fechar o tooltip quando clicar fora dele
  const handleOutsideTooltipPress = () => {
    if (activeProjectId) {
      setActiveProjectId(null);
    }
  };

  // Funções de carregamento do AsyncStorage
  const loadTasks = async () => {
    try {
      const storedTasks = await AsyncStorage.getItem('@todoList');
      if (storedTasks !== null) {
        setTasks(JSON.parse(storedTasks));
      }
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
    }
  };

  const loadProjects = async () => {
    try {
      const storedProjects = await AsyncStorage.getItem('@projects');
      if (storedProjects !== null) {
        setProjects(JSON.parse(storedProjects));
      }
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
    }
  };

  const loadReminders = async () => {
    try {
      const storedReminders = await AsyncStorage.getItem('@reminders');
      if (storedReminders !== null) {
        setReminders(JSON.parse(storedReminders));
      }
    } catch (error) {
      console.error('Erro ao carregar lembretes:', error);
    }
  };

  const loadHabits = async () => {
    try {
      const storedHabits = await AsyncStorage.getItem('@habits');
      if (storedHabits !== null) {
        setHabits(JSON.parse(storedHabits));
      }
    } catch (error) {
      console.error('Erro ao carregar hábitos:', error);
    }
  };

  // Funções de salvamento no AsyncStorage
  const saveTasks = async () => {
    try {
      await AsyncStorage.setItem('@todoList', JSON.stringify(tasks));
    } catch (error) {
      console.error('Erro ao salvar tarefas:', error);
    }
  };

  const saveProjects = async () => {
    try {
      await AsyncStorage.setItem('@projects', JSON.stringify(projects));
    } catch (error) {
      console.error('Erro ao salvar projetos:', error);
    }
  };

  const saveReminders = async () => {
    try {
      await AsyncStorage.setItem('@reminders', JSON.stringify(reminders));
    } catch (error) {
      console.error('Erro ao salvar lembretes:', error);
    }
  };

  const saveHabits = async () => {
    try {
      await AsyncStorage.setItem('@habits', JSON.stringify(habits));
    } catch (error) {
      console.error('Erro ao salvar hábitos:', error);
    }
  };

  // Adicionar novo projeto
  const addProject = () => {
    if (projectName.trim() === '') {
      Alert.alert('Erro', 'Digite um nome para o projeto');
      return;
    }

    const newProject = {
      id: Date.now().toString(),
      name: projectName,
      color: '#E8F5E9', // Verde claro como padrão
      cards: []
    };

    setProjects([...projects, newProject]);
    setProjectName('');
    setModalVisible(false);
  };

  // Adicionar novo lembrete
  const addReminder = () => {
    if (newReminder.trim() === '' && editingReminderText.trim() === '') {
      Alert.alert('Erro', 'Digite um lembrete');
      return;
    }

    if (editingReminderId) {
      const updatedReminders = reminders.map(reminder => 
        reminder.id === editingReminderId 
          ? { 
              ...reminder, 
              text: editingReminderText,
              date: editingReminderDate.toISOString()
            } 
          : reminder
      );
      setReminders(updatedReminders);
      setEditingReminderId(null);
      setEditingReminderText('');
    } else {
      const newReminderObj = {
        id: Date.now().toString(),
        text: newReminder,
        date: reminderDate.toISOString(),
        completed: false
      };
      setReminders([...reminders, newReminderObj]);
      setNewReminder('');
    }
    
    setReminderDate(new Date());
    setReminderModalVisible(false);
  };

  // Deletar lembrete
  const deleteReminder = (id) => {
    Alert.alert(
      'Confirmar exclusão',
      'Tem certeza que deseja excluir este lembrete?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Confirmar',
          onPress: () => {
            setReminders(reminders.filter(reminder => reminder.id !== id));
          }
        }
      ]
    );
  };

  // Alternar conclusão do lembrete
  const toggleReminderComplete = (id) => {
    const updatedReminders = reminders.map(reminder =>
      reminder.id === id ? { ...reminder, completed: !reminder.completed } : reminder
    );
    setReminders(updatedReminders);
  };

  // Deletar projeto
  const deleteProject = (id) => {
    Alert.alert(
      'Confirmar exclusão',
      'Tem certeza que deseja excluir este projeto?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Confirmar',
          onPress: () => {
            setProjects(projects.filter(project => project.id !== id));
            setActiveProjectId(null);
          }
        }
      ]
    );
  };

  // Abrir modal para editar nome do projeto
  const startEditingProject = (project) => {
    setEditingProject(project);
    setProjectName(project.name);
    setSelectedColor(project.color);
    setEditModalVisible(true);
    setActiveProjectId(null);
  };

  // Salvar edição do projeto
  const saveProjectEdits = () => {
    if (projectName.trim() === '') {
      Alert.alert('Erro', 'O nome do projeto não pode estar vazio');
      return;
    }

    const updatedProjects = projects.map(project => 
      project.id === editingProject.id 
        ? { ...project, name: projectName, color: selectedColor } 
        : project
    );
    
    setProjects(updatedProjects);
    setEditModalVisible(false);
    setEditingProject(null);
    setProjectName('');
  };

  // Abrir projeto
  const openProject = (project) => {
    setSelectedProject(project);
    setShowProjectScreen(true);
  };

  // Voltar para a tela principal
  const goBackToMain = () => {
    setShowProjectScreen(false);
    setSelectedProject(null);
  };

  // Adicionar nova tarefa
  const addTask = () => {
    if (task.trim() === '') {
      Alert.alert('Erro', 'Digite uma tarefa para adicionar');
      return;
    }

    // Adicionar nova tarefa
    const newId = Date.now().toString();
    setTasks([...tasks, { 
      id: newId, 
      text: task,
      completed: false
    }]);
    animationValues.current[newId] = new Animated.Value(0);
    progressAnimations.current[newId] = new Animated.Value(0);
    
    setTask('');
  };

  // Deletar tarefa
  const deleteTask = (id) => {
    Alert.alert(
      'Confirmar exclusão',
      'Tem certeza que deseja excluir esta tarefa?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Confirmar',
          onPress: () => {
            setTasks(tasks.filter(item => item.id !== id));
            if (editingId === id) {
              setEditingId(null);
              setEditingText('');
            }
            delete animationValues.current[id];
            delete progressAnimations.current[id];
          }
        }
      ]
    );
  };

  // Iniciar edição de tarefa
  const startEditing = (id, text) => {
    setEditingId(id);
    setEditingText(text);
  };

  // Cancelar edição
  const cancelEditing = () => {
    setEditingId(null);
    setEditingText('');
  };

  // Confirmar edição
  const confirmEditing = (id) => {
    if (editingText.trim() === '') {
      Alert.alert('Erro', 'A tarefa não pode estar vazia');
      return;
    }

    const updatedTasks = tasks.map(item => 
      item.id === id ? { ...item, text: editingText } : item
    );
    setTasks(updatedTasks);
    setEditingId(null);
    setEditingText('');
  };

  // Alternar status de conclusão da tarefa
  const toggleComplete = (id) => {
    const task = tasks.find(item => item.id === id);
    const isCompleting = !task.completed;
    
    const updatedTasks = tasks.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setTasks(updatedTasks);
    
    // Inicializar o valor da animação se não existir
    if (!animationValues.current[id]) {
      animationValues.current[id] = new Animated.Value(0);
    }
    
    if (!progressAnimations.current[id]) {
      progressAnimations.current[id] = new Animated.Value(0);
    }
    
    // Animar para 1 quando completar, ou para 0 quando descompletar
    Animated.timing(animationValues.current[id], {
      toValue: isCompleting ? 1 : 0,
      duration: 300,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false,
    }).start();
    
    // Animar a barra de progresso
    Animated.timing(progressAnimations.current[id], {
      toValue: isCompleting ? 1 : 0,
      duration: 700,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false,
    }).start();
  };

  // Formatar data do lembrete para exibição
  const formatReminderDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  // Função para iniciar edição de lembrete
  const startEditingReminder = (reminder) => {
    setEditingReminderId(reminder.id);
    setEditingReminderText(reminder.text);
    setEditingReminderDate(new Date(reminder.date));
    setReminderModalVisible(true);
  };

  // Renderizar cada item da lista de tarefas
  const renderItem = ({ item }) => {
    // Inicializar o valor da animação se não existir
    if (!animationValues.current[item.id]) {
      animationValues.current[item.id] = new Animated.Value(item.completed ? 1 : 0);
    }
    
    // Inicializar o valor da animação de progresso se não existir
    if (!progressAnimations.current[item.id]) {
      progressAnimations.current[item.id] = new Animated.Value(item.completed ? 1 : 0);
    }
    
    // Interpolações para animações
    const borderColor = animationValues.current[item.id].interpolate({
      inputRange: [0, 1],
      outputRange: ['rgba(0, 0, 0, 0)', 'rgba(77, 194, 90, 0.7)']
    });
    
    // Width para animação da esquerda para direita
    const progressWidth = progressAnimations.current[item.id].interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%']
    });
    
    // Cor do texto que muda para branco quando completa
    const textColor = progressAnimations.current[item.id].interpolate({
      inputRange: [0, 0.7, 1],
      outputRange: ['#333', '#fff', '#fff']
    });
    
    const isEditing = editingId === item.id;
    
    return (
      <View style={styles.taskItemContainer}>
        <Animated.View style={[
          styles.taskItemBackground,
          {
            width: progressWidth,
            backgroundColor: '#4DC25A',
          }
        ]} />
        
        <Animated.View style={[
          styles.taskItem,
          {
            borderColor: borderColor,
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderRadius: 8,
          }
        ]}>
          {isEditing ? (
            // Modo de edição
            <View style={styles.editContainer}>
              <TextInput
                style={styles.editInput}
                value={editingText}
                onChangeText={setEditingText}
                autoFocus
              />
              <View style={styles.editButtons}>
                <TouchableOpacity onPress={() => cancelEditing()} style={styles.cancelEditButton}>
                  <MaterialIcons name="close" size={22} color="#F44336" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => confirmEditing(item.id)} style={styles.confirmEditButton}>
                  <MaterialIcons name="check" size={22} color="#4DC25A" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // Modo normal
            <>
              <TouchableOpacity onPress={() => toggleComplete(item.id)} style={styles.taskTextContainer}>
                <MaterialIcons
                  name={item.completed ? "check-box" : "check-box-outline-blank"}
                  size={24}
                  color={item.completed ? "#fff" : "#757575"}
                  style={styles.checkIcon}
                />
                <Animated.Text style={[
                  styles.taskText,
                  { color: textColor },
                  item.completed && styles.completedTask
                ]}>
                  {item.text}
                </Animated.Text>
              </TouchableOpacity>
              
              <View style={styles.taskButtons}>
                <TouchableOpacity onPress={() => startEditing(item.id, item.text)} style={styles.editButton}>
                  <MaterialIcons name="edit" size={22} color={item.completed ? "#fff" : "#4DC25A"} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteTask(item.id)} style={styles.deleteButton}>
                  <MaterialIcons name="delete" size={22} color={item.completed ? "#fff" : "#F44336"} />
                </TouchableOpacity>
              </View>
            </>
          )}
        </Animated.View>
      </View>
    );
  };

  // Renderizar cada projeto
  const renderProject = ({ item }) => (
    <TouchableWithoutFeedback
      onLongPress={() => setActiveProjectId(item.id)}
      onPress={() => openProject(item)}
    >
      <View>
        <View 
          style={[styles.projectCard, { backgroundColor: item.color }]}
        >
          <Text style={styles.projectName}>{item.name}</Text>
          <View style={styles.projectStats}>
            <Text style={styles.projectStatsText}>
              {item.cards ? item.cards.length : 0} cards
            </Text>
          </View>
          
          {/* Tooltip/Menu que aparece ao segurar o card */}
          {activeProjectId === item.id && (
            <View style={styles.projectTooltip}>
              <TouchableOpacity 
                style={styles.tooltipOption}
                onPress={() => startEditingProject(item)}
              >
                <MaterialIcons name="edit" size={18} color="#333" />
                <Text style={styles.tooltipText}>Editar nome</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.tooltipOption}
                onPress={() => {
                  setEditingProject(item);
                  setProjectName(item.name);
                  setSelectedColor(item.color);
                  setActiveProjectId(null);
                  setEditModalVisible(true);
                }}
              >
                <MaterialIcons name="color-lens" size={18} color="#333" />
                <Text style={styles.tooltipText}>Mudar cor</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.tooltipOption}
                onPress={() => deleteProject(item.id)}
              >
                <MaterialIcons name="delete" size={18} color="#F44336" />
                <Text style={[styles.tooltipText, {color: '#F44336'}]}>Deletar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );

  // Renderizar cada lembrete
  const renderReminder = ({ item }) => (
    <View style={styles.reminderItem}>
      <TouchableOpacity 
        style={styles.reminderCheckbox}
        onPress={() => toggleReminderComplete(item.id)}
      >
        <MaterialIcons 
          name={item.completed ? "check-circle" : "radio-button-unchecked"} 
          size={24} 
          color={item.completed ? "#4DC25A" : "#BBBBBB"} 
        />
      </TouchableOpacity>
      
      <View style={styles.reminderContent}>
        <Text style={[
          styles.reminderText,
          item.completed && styles.reminderCompleted
        ]}>
          {item.text}
        </Text>
        <Text style={styles.reminderDate}>{formatReminderDate(item.date)}</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.reminderEditButton}
        onPress={() => startEditingReminder(item)}
      >
        <MaterialIcons name="edit" size={20} color="#4DC25A" />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.reminderDeleteButton}
        onPress={() => deleteReminder(item.id)}
      >
        <MaterialIcons name="delete-outline" size={22} color="#F44336" />
      </TouchableOpacity>
    </View>
  );

  // Nova função para selecionar imagem
  const pickProfileImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setTempUserAvatar(result.assets[0].uri);
    }
  };

  // Nova função para salvar alterações do perfil
  const saveProfileChanges = async () => {
    setUserName(tempUserName);
    setUserAvatar(tempUserAvatar);
    const updatedUser = { username: tempUserName, avatar: tempUserAvatar };
    await AsyncStorage.setItem('@loggedInUser', JSON.stringify(updatedUser));
    setProfileModalVisible(false);

    // Atualizar a lista de usuários
    const existingUsers = await AsyncStorage.getItem('@users');
    let users = existingUsers ? JSON.parse(existingUsers) : [];
    users = users.map((u) =>
      u.username === userName ? { ...u, username: tempUserName, avatar: tempUserAvatar } : u
    );
    await AsyncStorage.setItem('@users', JSON.stringify(users));
  };

  // Adicionar função de logout
  const handleLogout = async () => {
    await AsyncStorage.removeItem('@loggedInUser');
    navigation.replace('Login');
  };

  // Adicionar funções de gerenciamento de hábitos
  const addHabit = () => {
    if (habitName.trim() === '') {
      Alert.alert('Error', 'Please enter a habit name');
      return;
    }

    if (editingHabit) {
      // Edit existing habit
      const updatedHabits = habits.map(habit => 
        habit.id === editingHabit.id 
          ? { 
              ...habit, 
              name: habitName,
              priority: habitPriority
            } 
          : habit
      );
      setHabits(updatedHabits);
      setEditingHabit(null);
    } else {
      // Add new habit
      const newHabit = {
        id: Date.now().toString(),
        name: habitName,
        priority: habitPriority,
        streak: 0,
        bestStreak: 0,
        completed: false,
        lastCompleted: null,
        createdAt: new Date().toISOString()
      };
      setHabits([...habits, newHabit]);
    }
    
    setHabitName('');
    setHabitPriority('medium');
    setHabitModalVisible(false);
  };

  const toggleHabitComplete = (id) => {
    const today = new Date();
    const todayStr = today.toISOString();
    
    setHabits(currentHabits => 
      currentHabits.map(habit => {
        if (habit.id === id) {
          // If already completed today, uncomplete it
          if (habit.completed) {
            return { 
              ...habit, 
              completed: false,
              streak: Math.max(0, habit.streak - 1)
            };
          } else {
            // If completing for the first time today
            const newStreak = habit.streak + 1;
            return { 
              ...habit, 
              completed: true,
              streak: newStreak,
              bestStreak: Math.max(habit.bestStreak, newStreak),
              lastCompleted: todayStr
            };
          }
        }
        return habit;
      })
    );
  };

  const deleteHabit = (id) => {
    Alert.alert(
      'Confirm deletion',
      'Are you sure you want to delete this habit? Your streak will be lost.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          onPress: () => {
            setHabits(habits.filter(habit => habit.id !== id));
          },
          style: 'destructive'
        }
      ]
    );
  };

  const startEditingHabit = (habit) => {
    setEditingHabit(habit);
    setHabitName(habit.name);
    setHabitPriority(habit.priority);
    setHabitModalVisible(true);
  };

  // Priority color mapping
  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return '#FF5252';
      case 'medium': return '#FFB74D';
      case 'low': return '#4CAF50';
      default: return '#FFB74D';
    }
  };

  const getPriorityName = (priority) => {
    switch(priority) {
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return 'Medium';
    }
  };

  // Render habit item
  const renderHabitItem = ({ item }) => (
    <View style={styles.habitItem}>
      <View style={styles.habitLeftSection}>
        <TouchableOpacity 
          style={[styles.habitCheckbox, item.completed && styles.habitCheckboxCompleted]}
          onPress={() => toggleHabitComplete(item.id)}
        >
          {item.completed && <MaterialIcons name="check" size={18} color="#FFFFFF" />}
        </TouchableOpacity>
        
        <View style={styles.habitTextContainer}>
          <Text style={[styles.habitText, item.completed && styles.habitTextCompleted]}>
            {item.name}
          </Text>
          <View style={styles.habitDetailsRow}>
            <View style={[styles.priorityTag, { backgroundColor: getPriorityColor(item.priority) }]}>
              <Text style={styles.priorityText}>{getPriorityName(item.priority)}</Text>
            </View>
            <View style={styles.streakContainer}>
              <MaterialIcons name="local-fire-department" size={14} color="#FF9800" />
              <Text style={styles.streakText}>{item.streak} day{item.streak !== 1 && 's'}</Text>
            </View>
            {item.bestStreak > 0 && (
              <View style={styles.bestStreakContainer}>
                <MaterialIcons name="emoji-events" size={14} color="#FFC107" />
                <Text style={styles.bestStreakText}>{item.bestStreak}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      
      <View style={styles.habitActions}>
        <TouchableOpacity onPress={() => startEditingHabit(item)} style={styles.habitEditButton}>
          <MaterialIcons name="edit" size={20} color="#4DC25A" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => deleteHabit(item.id)} style={styles.habitDeleteButton}>
          <MaterialIcons name="delete-outline" size={20} color="#F44336" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Se estiver mostrando a tela de projeto, renderize-a em vez da tela principal
  if (showProjectScreen && selectedProject) {
    return (
      <ProjectScreen 
        project={selectedProject}
        goBack={goBackToMain}
        updateProject={(updatedProject) => {
          const updatedProjects = projects.map(p => 
            p.id === updatedProject.id ? updatedProject : p
          );
          setProjects(updatedProjects);
          setSelectedProject(updatedProject);
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header fixo */}
      <View style={styles.profileHeader}>
        <Image 
          source={{ uri: userAvatar }} 
          style={styles.profilePic} 
        />
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{userName}</Text>
          <Text style={styles.profileStatus}>Online</Text>
        </View>
        <TouchableOpacity style={styles.profileMenu} onPress={() => setProfileModalVisible(true)}>
          <MaterialIcons name="edit" size={24} color="#555" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={24} color="#F44336" />
        </TouchableOpacity>
      </View>
      
      {/* Conteúdo scrollável */}
      <ScrollView 
        style={styles.mainScrollView}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>MAKE-TODAY</Text>
          <Text style={styles.subtitle}>Hoje, {new Date().toLocaleDateString('pt-BR')}</Text>
        </View>
        
        {/* Barra de progresso fora do card */}
        <View style={styles.progressSection}>
          <View style={styles.statsRow}>
            <Text style={styles.statsText}>
             {completedTasks}  / {totalTasks}  ({completionPercentage}%)
            </Text>
          </View>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${completionPercentage}%` }]} />
          </View>
        </View>

        {/* Card de tarefas */}
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <View style={styles.cardContent}>
              {tasks.length > 0 ? (
                <FlatList
                  data={tasks}
                  renderItem={renderItem}
                  keyExtractor={item => item.id}
                  style={styles.list}
                  contentContainerStyle={styles.listContent}
                  nestedScrollEnabled={true}
                />
              ) : (
                <View style={styles.emptyList}>
                  <MaterialIcons name="check-box" size={50} color="#E5E5E5" />
                  <Text style={styles.emptyText}>Nenhuma tarefa para hoje</Text>
                  <Text style={styles.emptySubtext}>Adicione tarefas abaixo</Text>
                </View>
              )}

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Adicionar uma tarefa..."
                  value={task}
                  onChangeText={setTask}
                  placeholderTextColor="rgba(0,0,0,0.5)"
                />
                <TouchableOpacity 
                  style={styles.addButton} 
                  onPress={addTask}
                >
                  <MaterialIcons name="add" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
        
        {/* Seção de Projetos */}
        <View style={styles.projectsSection}>
          <Text style={styles.sectionTitle}>Projetos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.projectsContainer}>
            {/* Card Create */}
            <TouchableOpacity 
              style={styles.createProjectCard}
              onPress={() => {
                setModalVisible(true);
                setActiveProjectId(null);
              }}
            >
              <MaterialIcons name="add" size={40} color="#4DC25A" />
            </TouchableOpacity>
            
            {/* Projetos */}
            <FlatList
              data={projects}
              renderItem={renderProject}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.projectsList}
            />
          </ScrollView>
        </View>
        
        {/* Seção de Lembretes */}
        <View style={styles.remindersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Lembretes</Text>
            <TouchableOpacity 
              style={styles.addReminderButton}
              onPress={() => setReminderModalVisible(true)}
            >
              <MaterialIcons name="add" size={24} color="#4DC25A" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.remindersContainer}>
            {reminders.length > 0 ? (
              <FlatList
                data={reminders}
                renderItem={renderReminder}
                keyExtractor={item => item.id}
                style={styles.remindersList}
                contentContainerStyle={styles.remindersContent}
                nestedScrollEnabled={true}
              />
            ) : (
              <View style={styles.emptyReminders}>
                <MaterialIcons name="notifications-none" size={50} color="#E5E5E5" />
                <Text style={styles.emptyText}>Nenhum lembrete</Text>
                <Text style={styles.emptySubtext}>Toque no + para adicionar</Text>
              </View>
            )}
          </View>
        </View>

        {/* Adicione a seção de hábitos aqui, antes do fechamento do ScrollView */}
        <View style={styles.habitsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Everyday Tasks</Text>
            <TouchableOpacity 
              style={styles.addHabitButton}
              onPress={() => {
                setEditingHabit(null);
                setHabitName('');
                setHabitPriority('medium');
                setHabitModalVisible(true);
              }}
            >
              <MaterialIcons name="add" size={24} color="#4DC25A" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.habitsContainer}>
            {habits.length > 0 ? (
              <FlatList
                data={habits}
                renderItem={renderHabitItem}
                keyExtractor={item => item.id}
                style={styles.habitsList}
                contentContainerStyle={styles.habitsContent}
                nestedScrollEnabled={true}
              />
            ) : (
              <View style={styles.emptyHabits}>
                <MaterialIcons name="repeat" size={50} color="#E5E5E5" />
                <Text style={styles.emptyText}>No daily habits yet</Text>
                <Text style={styles.emptySubtext}>Tap + to start building habits</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      
      {/* Overlay para fechar tooltip */}
      {activeProjectId && (
        <TouchableWithoutFeedback onPress={handleOutsideTooltipPress}>
          <View style={styles.tooltipOverlay} />
        </TouchableWithoutFeedback>
      )}
      
      {/* Modal para criar projeto */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Novo Projeto</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nome do projeto"
              value={projectName}
              onChangeText={setProjectName}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => {
                  setModalVisible(false);
                  setProjectName('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.createButton]} 
                onPress={addProject}
              >
                <Text style={styles.createButtonText}>Criar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Modal para editar projeto */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Projeto</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nome do projeto"
              value={projectName}
              onChangeText={setProjectName}
            />
            
            {/* Seleção de cores */}
            <Text style={styles.colorSelectorLabel}>Cor do projeto:</Text>
            <View style={styles.colorSelector}>
              {projectColors.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.selectedColorOption
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => {
                  setEditModalVisible(false);
                  setEditingProject(null);
                  setProjectName('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.createButton]} 
                onPress={saveProjectEdits}
              >
                <Text style={styles.createButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Modal para adicionar lembrete */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={reminderModalVisible}
        onRequestClose={() => {
          setReminderModalVisible(false);
          setEditingReminderId(null);
          setEditingReminderText('');
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingReminderId ? "Editar Lembrete" : "Novo Lembrete"}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Digite o lembrete"
              value={editingReminderId ? editingReminderText : newReminder}
              onChangeText={text => {
                if (editingReminderId) {
                  setEditingReminderText(text);
                } else {
                  setNewReminder(text);
                }
              }}
            />
            
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <MaterialIcons name="calendar-today" size={20} color="#4DC25A" />
              <Text style={styles.datePickerText}>
                {reminderDate.toLocaleDateString('pt-BR')}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => {
                  setReminderModalVisible(false);
                  setNewReminder('');
                  setEditingReminderId(null);
                  setEditingReminderText('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.createButton]} 
                onPress={addReminder}
              >
                <Text style={styles.createButtonText}>
                  {editingReminderId ? "Salvar" : "Adicionar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Novo modal de edição de perfil */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={profileModalVisible}
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Perfil</Text>
            
            <TouchableOpacity 
              style={styles.avatarPicker}
              onPress={pickProfileImage}
            >
              {tempUserAvatar ? (
                <Image source={{ uri: tempUserAvatar }} style={styles.avatarPreview} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <MaterialIcons name="person" size={40} color="#aaa" />
                </View>
              )}
              <View style={styles.editAvatarIcon}>
                <MaterialIcons name="edit" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
            
            <Text style={styles.inputLabel}>Nome</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Seu nome"
              value={tempUserName}
              onChangeText={setTempUserName}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setProfileModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.createButton]} 
                onPress={saveProfileChanges}
              >
                <Text style={styles.createButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Adicione o modal de hábitos aqui, junto com os outros modais */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={habitModalVisible}
        onRequestClose={() => {
          setHabitModalVisible(false);
          setEditingHabit(null);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingHabit ? "Edit Habit" : "New Daily Habit"}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="What habit do you want to build?"
              value={habitName}
              onChangeText={setHabitName}
            />
            
            <Text style={styles.priorityLabel}>Priority:</Text>
            <View style={styles.prioritySelector}>
              <TouchableOpacity 
                style={[
                  styles.priorityOption, 
                  { backgroundColor: habitPriority === 'low' ? '#4CAF50' : '#F5F5F5' }
                ]}
                onPress={() => setHabitPriority('low')}
              >
                <Text style={[styles.priorityOptionText, habitPriority === 'low' && { color: '#FFFFFF' }]}>
                  Low
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.priorityOption, 
                  { backgroundColor: habitPriority === 'medium' ? '#FFB74D' : '#F5F5F5' }
                ]}
                onPress={() => setHabitPriority('medium')}
              >
                <Text style={[styles.priorityOptionText, habitPriority === 'medium' && { color: '#FFFFFF' }]}>
                  Medium
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.priorityOption, 
                  { backgroundColor: habitPriority === 'high' ? '#FF5252' : '#F5F5F5' }
                ]}
                onPress={() => setHabitPriority('high')}
              >
                <Text style={[styles.priorityOptionText, habitPriority === 'high' && { color: '#FFFFFF' }]}>
                  High
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => {
                  setHabitModalVisible(false);
                  setEditingHabit(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.createButton]} 
                onPress={addHabit}
              >
                <Text style={styles.createButtonText}>
                  {editingHabit ? "Save" : "Create"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mainScrollView: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 30,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  profilePic: {
    width: 45,
    height: 45,
    borderRadius: 25,
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  profileStatus: {
    fontSize: 13,
    color: '#4DC25A',
  },
  profileMenu: {
    padding: 5,
  },
  header: {
    marginTop: 15,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4DC25A',
  },
  subtitle: {
    fontSize: 16,
    color: '#4A7057',
    marginTop: 5,
  },
  progressSection: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statsText: {
    fontSize: 14,
    color: '#555',
  },
  progressContainer: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4DC25A',
  },
  cardContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  card: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 15,
  },
  cardContent: {
    padding: 15,
  },
  list: {
    height: 300,
    maxHeight: 300,
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyList: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#4A7057',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8BAB96',
    marginTop: 8,
  },
  taskItemContainer: {
    position: 'relative',
    marginBottom: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  taskItemBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: '#4DC25A',
    zIndex: 1,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    zIndex: 2,
    backgroundColor: 'transparent',
  },
  taskTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIcon: {
    marginRight: 10,
    zIndex: 3,
  },
  taskText: {
    fontSize: 16,
    flex: 1,
    zIndex: 3,
  },
  completedTask: {
    textDecorationLine: 'line-through',
  },
  taskButtons: {
    flexDirection: 'row',
    zIndex: 3,
  },
  editButton: {
    padding: 8,
    marginRight: 5,
  },
  deleteButton: {
    padding: 8,
  },
  editContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editInput: {
    flex: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 4,
    paddingHorizontal: 10,
    marginRight: 10,
    color: '#333',
  },
  editButtons: {
    flexDirection: 'row',
  },
  cancelEditButton: {
    padding: 8,
    marginRight: 5,
  },
  confirmEditButton: {
    padding: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    marginTop: 15,
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(77, 194, 90, 0.3)',
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    color: '#333',
  },
  addButton: {
    width: 50,
    height: 50,
    backgroundColor: '#4DC25A',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  projectsSection: {
    marginTop: 20,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A7057',
    marginBottom: 15,
  },
  projectsContainer: {
    flexDirection: 'row',
  },
  projectsList: {
    paddingRight: 20,
  },
  projectCard: {
    width: 150,
    height: 130,
    borderRadius: 15,
    padding: 15,
    marginRight: 15,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    position: 'relative',
  },
  createProjectCard: {
    width: 150,
    height: 130,
    backgroundColor: 'rgba(77, 194, 90, 0.1)',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 2,
    borderColor: 'rgba(77, 194, 90, 0.3)',
    borderStyle: 'dashed',
  },
  projectName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  projectStats: {
    marginTop: 5,
  },
  projectStatsText: {
    fontSize: 12,
    color: '#777',
  },
  projectTooltip: {
    position: 'absolute',
    top: -15,
    right: -15,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: 150,
    zIndex: 100,
  },
  tooltipOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tooltipText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  },
  remindersSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  addReminderButton: {
    padding: 5,
  },
  remindersContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
    padding: 15,
  },
  remindersList: {
    maxHeight: 300,
  },
  remindersContent: {
    paddingBottom: 10,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  reminderCheckbox: {
    marginRight: 12,
  },
  reminderContent: {
    flex: 1,
  },
  reminderText: {
    fontSize: 16,
    color: '#333',
  },
  reminderCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  reminderDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  reminderDeleteButton: {
    padding: 5,
  },
  emptyReminders: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4DC25A',
    marginBottom: 20,
  },
  modalInput: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '48%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  createButton: {
    backgroundColor: '#4DC25A',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  createButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  colorSelectorLabel: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    fontSize: 16,
    color: '#555',
  },
  colorSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 10,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedColorOption: {
    borderWidth: 3,
    borderColor: '#4DC25A',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  datePickerText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  reminderEditButton: {
    padding: 5,
    marginRight: 5,
  },
  avatarPicker: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
    position: 'relative',
    alignSelf: 'center',
  },
  avatarPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4DC25A',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  inputLabel: {
    alignSelf: 'flex-start',
    marginBottom: 5,
    fontSize: 16,
    color: '#555',
  },
  logoutButton: {
    padding: 5,
    marginLeft: 10,
  },
  tooltipOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    zIndex: 99,
  },
  habitsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  habitsContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
    padding: 15,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  habitLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  habitCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4DC25A',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitCheckboxCompleted: {
    backgroundColor: '#4DC25A',
    borderColor: '#4DC25A',
  },
  habitTextContainer: {
    flex: 1,
  },
  habitText: {
    fontSize: 16,
    color: '#333',
  },
  habitTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  habitDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  priorityTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  priorityText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  streakText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  bestStreakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bestStreakText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  habitActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  habitEditButton: {
    padding: 5,
    marginRight: 5,
  },
  habitDeleteButton: {
    padding: 5,
  },
  priorityLabel: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    fontSize: 16,
    color: '#555',
  },
  prioritySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  priorityOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  emptyHabits: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
});