import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const ProjectCalendar = ({ navigation }) => {
  const [currentMonth, setCurrentMonth] = useState(1); // Inicialmente, janeiro
  const [currentYear, setCurrentYear] = useState(2024); // Ano atual

  const navigateToProjectCalendar = () => {
    navigation.goBack();
  };

  const goToNextMonth = () => {
    let nextMonth = currentMonth + 1;
    let nextYear = currentYear;

    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear++;
    }

    setCurrentMonth(nextMonth);
    setCurrentYear(nextYear);
  };

  const goToPreviousMonth = () => {
    let previousMonth = currentMonth - 1;
    let previousYear = currentYear;

    if (previousMonth < 1) {
      previousMonth = 12;
      previousYear--;
    }

    setCurrentMonth(previousMonth);
    setCurrentYear(previousYear);
  };

  // Função para obter o número total de dias no mês atual
  const getTotalDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
  };

  // Função para renderizar os cards de dias do mês atual
  const renderDayCards = () => {
    const totalDays = getTotalDaysInMonth(currentMonth, currentYear);

    const dayCards = [];

    for (let i = 1; i <= totalDays; i++) {
      dayCards.push(
        <TouchableOpacity key={i} style={styles.dayCard} onPress={() => handleDayPress(i)}>
          <Text style={styles.dayText}>{i}</Text>
        </TouchableOpacity>
      );
    }

    return dayCards;
  };

  const handleDayPress = (day) => {
    // Implemente a lógica para lidar com a seleção de um dia
    console.log('Dia selecionado:', day);
  };

  return (
    <View style={styles.container}>
      <View style={styles.monthHeader}>
        <TouchableOpacity onPress={goToPreviousMonth} style={styles.arrowButton}>
          <Text style={styles.arrow}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.monthText}>{getMonthName(currentMonth)} {currentYear}</Text>
        <TouchableOpacity onPress={goToNextMonth} style={styles.arrowButton}>
          <Text style={styles.arrow}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.backButton} onPress={navigateToProjectCalendar}>
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>

      <View style={styles.calendarGrid}>{renderDayCards()}</View>
    </View>
  );
};

const getMonthName = (month) => {
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  return monthNames[month - 1];
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#E5F5F0',
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  arrowButton: {
    paddingHorizontal: 10,
  },
  arrow: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#4DC25A',
    borderRadius: 5,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 20,
  },
  dayCard: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#63BD63',
    margin: 5,
    borderRadius: 5,
  },
  dayText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default ProjectCalendar;
