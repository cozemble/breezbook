import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CalendarWithLabels = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [timeFormat, setTimeFormat] = useState('24h');
    const [dateLabels, setDateLabels] = useState({});
    const [timeLabels, setTimeLabels] = useState({});
    const [disabledDays, setDisabledDays] = useState({});

    useEffect(() => {
        generateDateLabels();
    }, [currentMonth]);

    const generateDateLabels = () => {
        const labels = {};
        const timePrices = {};
        const disabled = {};
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateString = date.toISOString().split('T')[0];
            const price = Math.floor(Math.random() * (100 - 30 + 1) + 30);
            labels[dateString] = `£${price}`;

            // Randomly disable some days (20% chance)
            if (Math.random() < 0.2) {
                disabled[dateString] = true;
            } else {
                // Generate time labels for non-disabled days
                timePrices[dateString] = {};
                ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
                    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'].forEach(time => {
                    // 30% chance of having a specific time price
                    if (Math.random() < 0.3) {
                        const timePrice = Math.floor(Math.random() * (60 - 20 + 1) + 20);
                        timePrices[dateString][time] = `£${timePrice}`;
                    }
                });
            }
        }
        setDateLabels(labels);
        setTimeLabels(timePrices);
        setDisabledDays(disabled);
    };

    const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const startDay = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const handleDateSelect = (date) => {
        const dateString = date.toISOString().split('T')[0];
        if (!disabledDays[dateString]) {
            setSelectedDate(date);
            setSelectedTime(null);
        }
    };

    const handleTimeSelect = (time) => {
        setSelectedTime(time);
    };

    const renderDays = () => {
        const days = [];
        const totalDays = daysInMonth(currentMonth);
        const startingDay = startDay(currentMonth);

        for (let i = 0; i < startingDay; i++) {
            days.push(<div key={`empty-${i}`} className="p-2"></div>);
        }

        for (let i = 1; i <= totalDays; i++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
            const dateString = date.toISOString().split('T')[0];
            const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
            const isToday = date.toDateString() === new Date().toDateString();
            const isDisabled = disabledDays[dateString];
            const label = !isDisabled ? dateLabels[dateString] : null;

            days.push(
                <button
                    key={i}
                    onClick={() => handleDateSelect(date)}
                    disabled={isDisabled}
                    className={`p-2 flex flex-col items-center justify-center w-full h-full rounded-lg transition-colors ${
                        isDisabled
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : isSelected
                                ? 'bg-blue-600 text-white'
                                : isToday
                                    ? 'bg-gray-800 text-white border-2 border-blue-400'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                >
                    <span className="text-sm md:text-base font-semibold">{i}</span>
                    {label && <span className="text-xs md:text-sm text-gray-400">{label}</span>}
                </button>
            );
        }

        return days;
    };

    const renderTimeSlots = () => {
        const times = [
            '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
            '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
        ];

        const dateString = selectedDate ? selectedDate.toISOString().split('T')[0] : '';
        const dayTimeLabels = timeLabels[dateString] || {};

        return times.map(time => {
            const timeLabel = dayTimeLabels[time];
            return (
                <button
                    key={time}
                    onClick={() => handleTimeSelect(time)}
                    className={`p-2 m-1 rounded text-sm md:text-base w-full flex flex-col items-center justify-center ${
                        selectedTime === time
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                >
                    <span>{timeFormat === '12h' ? convertTo12Hour(time) : time}</span>
                    {timeLabel && <span className="text-xs mt-1 text-gray-400">{timeLabel}</span>}
                </button>
            );
        });
    };

    const convertTo12Hour = (time24) => {
        const [hour, minute] = time24.split(':');
        let hour12 = parseInt(hour, 10) % 12;
        hour12 = hour12 === 0 ? 12 : hour12;
        const amPm = parseInt(hour, 10) >= 12 ? 'PM' : 'AM';
        return `${hour12}:${minute} ${amPm}`;
    };

    return (
        <div className="bg-gray-900 text-gray-100 shadow-lg rounded-lg p-4 w-full max-w-screen-md mx-auto">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl md:text-2xl font-bold">
                    {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex">
                    <button onClick={prevMonth} className="p-2 rounded-full hover:bg-gray-700">
                        <ChevronLeft size={24} />
                    </button>
                    <button onClick={nextMonth} className="p-2 rounded-full hover:bg-gray-700">
                        <ChevronRight size={24} />
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center mb-2">
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                    <div key={day} className="text-xs md:text-sm font-semibold text-gray-400">
                        {day}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-2 mb-4">
                {renderDays()}
            </div>
            {selectedDate && (
                <div className="mt-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg md:text-xl font-semibold">
                            {selectedDate.toLocaleString('default', { weekday: 'short', day: 'numeric' })}
                        </h3>
                        <div className="flex rounded-md shadow-sm">
                            <button
                                onClick={() => setTimeFormat('12h')}
                                className={`px-4 py-2 text-sm md:text-base rounded-l-md ${
                                    timeFormat === '12h'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                                12h
                            </button>
                            <button
                                onClick={() => setTimeFormat('24h')}
                                className={`px-4 py-2 text-sm md:text-base rounded-r-md ${
                                    timeFormat === '24h'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                                24h
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                        {renderTimeSlots()}
                    </div>
                </div>
            )}
            {selectedDate && selectedTime && (
                <div className="mt-6 p-4 bg-gray-700 rounded">
                    <h2 className="text-lg md:text-xl font-semibold mb-2">Selected Date and Time:</h2>
                    <p className="text-base md:text-lg">{selectedDate.toDateString()} at {selectedTime}</p>
                    <p className="text-base md:text-lg">
                        Price: {timeLabels[selectedDate.toISOString().split('T')[0]]?.[selectedTime] || dateLabels[selectedDate.toISOString().split('T')[0]]}
                    </p>
                </div>
            )}
        </div>
    );
};

export default CalendarWithLabels;