import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  PanResponder,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
const Tab = createBottomTabNavigator();
import { useRoute } from "@react-navigation/native";
import { debounce } from "lodash";

const Project = ({ navigation }) => {
  const route = useRoute();

  const [modalVisible, setModalVisible] = useState(false);
  const [cards, setCards] = useState([]);
  const [todoInput, setTodoInput] = useState("");
  const [noteInputs, setNoteInputs] = useState({});
  const [financeModalVisible, setFinanceModalVisible] = useState(false);
  const [financeValue, setFinanceValue] = useState("");
  const [balance, setBalance] = useState(0);
  const [depositedValue, setDepositedValue] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [financeName, setFinanceName] = useState("");
  const [editMode, setEditMode] = useState({});
  const projectName = route.params?.title || "";
  const { title } = route.params;
  // Define and initialize panResponder
  // Define and initialize panResponder
  const [panResponder, setPanResponder] = useState(null);

  const ProjectNameModal = ({ isVisible, onClose, onSave }) => {
    const [projectName, setProjectName] = useState("");
  };

  const goProject = () => {
    navigation.navigate("Projec123123t", { title: projectName });
  };

  const handleSaveProjectName = (name) => {
    setProjectName(name);
    setModalVisible(false);
  };

  useEffect(() => {
    // Initialize panResponder
    const newPanResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => handleCardMove(gestureState),
      onPanResponderRelease: () => {
        // Reset the card positions when the touch is released
        setCards((prevList) => prevList.slice().sort((a, b) => a.y - b.y));
      },
    });
    setPanResponder(newPanResponder);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(`cards_${projectName}`)
      .then((savedCards) => {
        if (savedCards) {
          console.log("Loading saved cards:", savedCards);
          setCards(JSON.parse(savedCards));
        }
      })
      .catch((error) => {
        console.error("Error loading saved cards:", error);
      });
  }, [projectName]);

  const saveCards = debounce(async (cards) => {
    try {
      await AsyncStorage.setItem(`cards_${title}`, JSON.stringify(cards));
    } catch (error) {
      Alert.alert("Erro", "Não foi possível salvar os dados");
    }
  }, 500);

  useEffect(() => {
    saveCards(cards);
  }, [cards]);

  const handleCardMove = (gestureState) => {
    const newTodayList = todayList.map((task, index) => {
      if (index === editIndex) {
        return { ...task, y: gestureState.moveY };
      }
      return task;
    });
    setTodayList(newTodayList);
  };

  const saveNote = (index) => {
    setCards(
      cards.map((card, cardIndex) => {
        if (cardIndex === index) {
          return { ...card, text: noteInputs[index] };
        }
        return card;
      })
    );
  };

  const addCard = (type) => {
    switch (type) {
      case "todo":
        setCards([...cards, { type, todos: [] }]);
        break;
      case "note":
        setCards([...cards, { type, text: noteInputs[cards.length] }]);
        setNoteInputs({ ...noteInputs, [cards.length]: "" });
        break;
      case "finance":
        setCards([...cards, { type: "finance" }]);
        break;
      default:
        break;
    }
    setModalVisible(false);
  };

  const deleteCard = (index) => {
    setCards(cards.filter((_, i) => i !== index));
    const newNoteInputs = { ...noteInputs };
    delete newNoteInputs[index];
    setNoteInputs(newNoteInputs);
  };

  const depositValue = (value, cardIndex, name) => {
    setBalance(balance + value);
    setCards(
      cards.map((card, index) => {
        if (index === cardIndex) {
          return {
            ...card,
            depositedValues: [...(card.depositedValues || []), { name, value }],
          };
        }
        return card;
      })
    );
  };

  const addDebt = (value, cardIndex, name) => {
    setBalance(balance + value);
    setCards(
      cards.map((card, index) => {
        if (index === cardIndex) {
          return {
            ...card,
            depositedValues: [...(card.depositedValues || []), { name, value }],
          };
        }
        return card;
      })
    );
  };

  const addTodo = (index) => {
    if (todoInput.trim() === "") {
      Alert.alert("Erro", "Você não pode adicionar uma tarefa vazia");
      return;
    }
    const newCards = [...cards];
    newCards[index].todos.push({ text: todoInput, completed: false });
    setCards(newCards);
    setTodoInput("");
  };

  const moveCard = (index, direction) => {
    const newCards = [...cards];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    [newCards[index], newCards[newIndex]] = [
      newCards[newIndex],
      newCards[index],
    ];
    setCards(newCards);
  };

  const deleteTodo = (cardIndex, todoIndex) => {
    const newCards = [...cards];
    newCards[cardIndex].todos.splice(todoIndex, 1);
    setCards(newCards);
  };

  const toggleTodo = (cardIndex, todoIndex) => {
    const newCards = [...cards];
    newCards[cardIndex].todos[todoIndex].completed =
      !newCards[cardIndex].todos[todoIndex].completed;
    setCards(newCards);
  };

  return (
    <View style={styles.container}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ProjectNameModal
          isVisible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSave={handleSaveProjectName}
        />
      </View>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
      <ScrollView style={styles.scrollView}>
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(!modalVisible);
          }}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalText}>Adicionar:</Text>
              <TouchableOpacity
                style={{ ...styles.openButton, backgroundColor: "#3CB371" }}
                onPress={() => addCard("todo")}
              >
                <Text style={styles.textStyle}>Lista de Tarefas</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ ...styles.openButton, backgroundColor: "#3CB371" }}
                onPress={() => addCard("note")}
              >
                <Text style={styles.textStyle}>Bloco de Notas</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ ...styles.openButton, backgroundColor: "#3CB371" }}
                onPress={() => addCard("finance")}
              >
                <Text style={styles.textStyle}>Finanças</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {cards.map((card, index) => (
          <View key={index} style={styles.card}>
            {(() => {
              switch (card.type) {
                case "todo":
                  return (
                    <TodoCard
                      todos={card.todos}
                      onAddTodo={() => addTodo(index)}
                      onDeleteTodo={(todoIndex) => deleteTodo(index, todoIndex)}
                      onToggleTodo={(todoIndex) => toggleTodo(index, todoIndex)}
                      todoInput={todoInput}
                      setTodoInput={setTodoInput}
                    />
                  );

                case "note":
                  return (
                    <>
                      {editMode[index] ? (
                        <>
                          <TextInput
                            multiline
                            numberOfLines={4}
                            style={styles.input}
                            onChangeText={(text) =>
                              setNoteInputs({ ...noteInputs, [index]: text })
                            }
                            value={noteInputs[index]}
                            placeholder="Digite aqui"
                          />
                          <TouchableOpacity
                            style={styles.button}
                            onPress={() => {
                              saveNote(index);
                              setEditMode({ ...editMode, [index]: false });
                            }}
                          >
                            <Text style={styles.buttonText}>Save</Text>
                          </TouchableOpacity>
                        </>
                      ) : (
                        <>
                          {card.text ? (
                            <Text
                              onPress={() =>
                                setEditMode({ ...editMode, [index]: true })
                              }
                            >
                              {card.text}
                            </Text>
                          ) : (
                            <TouchableOpacity
                              style={styles.addButton}
                              onPress={() =>
                                setEditMode({ ...editMode, [index]: true })
                              }
                            >
                              <Text style={styles.addButtonText}>+</Text>
                            </TouchableOpacity>
                          )}
                        </>
                      )}
                    </>
                  );

                case "finance": {
                  const totalValue = card.depositedValues
                    ? card.depositedValues.reduce(
                        (acc, transaction) => acc + transaction.value,
                        0
                      )
                    : 0;

                  return (
                    <>
                      <Text style={{ fontWeight: "bold", fontSize: 17 }}>
                        Finanças
                      </Text>
                      <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => setFinanceModalVisible(true)}
                      >
                        <Text style={styles.addButtonText}>+</Text>
                      </TouchableOpacity>
                      {card.depositedValues &&
                        card.depositedValues.map((transaction, index) => (
                          <Text
                            key={index}
                            style={{
                              color: transaction.value < 0 ? "red" : "green",
                            }}
                          >
                            {transaction.name} {transaction.value.toFixed(2)}
                          </Text>
                        ))}

                      <Text
                        style={{
                          fontWeight: "bold",
                          fontSize: 17,
                          color: totalValue < 0 ? "red" : "green",
                        }}
                      >
                        Total: {totalValue.toFixed(2)}
                      </Text>
                      <Modal
                        animationType="slide"
                        transparent={true}
                        visible={financeModalVisible}
                        onRequestClose={() => setFinanceModalVisible(false)}
                      >
                        <ScrollView contentContainerStyle={styles.centeredView}>
                          <View style={styles.modalView}>
                            <Text style={styles.modalText}>
                              Opções de Finanças:
                            </Text>
                            <TextInput
                              style={styles.input}
                              onChangeText={setFinanceName}
                              value={financeName}
                              placeholder="Nome"
                            />
                            <TextInput
                              style={styles.input}
                              onChangeText={setFinanceValue}
                              value={financeValue}
                              placeholder="Valor"
                              keyboardType="numeric"
                            />
                            {showAlert && (
                              <Text style={{ color: "red" }}>
                                Você não pode adicionar um valor vazio
                              </Text>
                            )}
                            <TouchableOpacity
                              style={{
                                ...styles.openButton,
                                backgroundColor: "#3CB371",
                              }}
                              onPress={() => {
                                if (
                                  financeValue.trim() === "" ||
                                  isNaN(parseFloat(financeValue))
                                ) {
                                  setShowAlert(true);
                                  return;
                                }
                                depositValue(
                                  parseFloat(financeValue),
                                  index,
                                  financeName
                                );
                                setFinanceModalVisible(false);
                                setFinanceValue("");
                                setShowAlert(false);
                              }}
                            >
                              <Text style={styles.textStyle}>
                                Depositar Valor
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={{
                                ...styles.openButton,
                                backgroundColor: "#3CB371",
                              }}
                              onPress={() => {
                                if (
                                  financeValue.trim() === "" ||
                                  isNaN(parseFloat(financeValue))
                                ) {
                                  setShowAlert(true);
                                  return;
                                }
                                addDebt(
                                  -parseFloat(financeValue),
                                  index,
                                  financeName
                                );
                                setFinanceModalVisible(false);
                                setFinanceValue("");
                                setShowAlert(false);
                              }}
                            >
                              <Text style={styles.textStyle}>
                                Adicionar Dívida
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </ScrollView>
                      </Modal>
                    </>
                  );
                }

                default:
                  return null;
              }
            })()}
            <View style={{ flexDirection: "row" }}>
              {index !== 0 && (
                <TouchableOpacity onPress={() => moveCard(index, "up")}>
                  <Feather name="arrow-up" size={24} color="#333" />
                </TouchableOpacity>
              )}
              {index !== cards.length - 1 && (
                <TouchableOpacity onPress={() => moveCard(index, "down")}>
                  <Feather name="arrow-down" size={24} color="#333" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteCard(index)}
            >
              <Feather name="x" size={24} color="red" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 16,
  },
  scrollView: {
    flex: 1,
    width: "100%",
  },
  addButton: {
    borderRadius: 50,
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#3CB371",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 30,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  todo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  deleteButton: {
    margin: 0,
    width: 40,
    color: "red",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  openButton: {
    backgroundColor: "#3CB371",
    borderRadius: 20,
    margin: 2,
    padding: 10,
    elevation: 2,
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    marginVertical: 10,
    width: "90%",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default Project;
