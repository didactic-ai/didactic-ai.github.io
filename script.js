const objects = ['fas fa-star', 'fas fa-heart', 'fas fa-bell', 'fas fa-apple-alt', 'fas fa-car'];
const objectNames = ['stars', 'hearts', 'bells', 'apples', 'cars'];
const diceIcons = ['fas fa-dice-one', 'fas fa-dice-two', 'fas fa-dice-three', 'fas fa-dice-four', 'fas fa-dice-five'];
let currentCount = 0;
let targetCount = 0;
let currentObjectIndex = 0;
let currentLevel = 1;
let correctStreak = 0;

function generateRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomPosition(gameArea, objectSize) {
    const padding = 100;
    const maxX = gameArea.clientWidth - objectSize - (2 * padding);
    const maxY = gameArea.clientHeight - objectSize - (2 * padding);
    
    const randomX = Math.floor(Math.random() * maxX) + padding;
    const randomY = Math.floor(Math.random() * maxY) + padding;
    
    return [randomX, randomY];
}

function setupGame() {
    const promptElement = document.getElementById('prompt');
    const objectsArea = document.getElementById('objects-area');
    const numbersContainer = document.getElementById('numbers');
    
    targetCount = generateRandomNumber(1, getLevelMaxObjects());
    currentObjectIndex = Math.floor(Math.random() * objects.length);
    objectsArea.innerHTML = '';
    
    const promptText = `Count how many ${objectNames[currentObjectIndex]}?`;
    promptElement.innerHTML = promptText.split(' ').map(word => `<span>${word}</span>`).join(' ');
    speak(promptText, true);
    
    const placedObjects = [];
    const objectSize = 60;
    const minDistance = 100;

    for (let i = 0; i < targetCount; i++) {
        placeObject(objectsArea, placedObjects, objects[currentObjectIndex], objectSize, minDistance);
    }

    // Add extra objects for Level 3 and above
    if (currentLevel >= 3) {
        const extraObjects = generateRandomNumber(0, 2);
        for (let i = 0; i < extraObjects; i++) {
            let extraObjectIndex;
            do {
                extraObjectIndex = Math.floor(Math.random() * objects.length);
            } while (extraObjectIndex === currentObjectIndex);
            placeObject(objectsArea, placedObjects, objects[extraObjectIndex], objectSize, minDistance, true);
        }
    }

    numbersContainer.innerHTML = '';
    for (let i = 0; i < getLevelMaxObjects(); i++) {
        const numberElement = document.createElement('div');
        numberElement.className = 'number';
        numberElement.innerHTML = `
            <i class="${diceIcons[i]}"></i>
            <span class="arabic">${i + 1}</span>
        `;
        numberElement.onclick = () => checkAnswer(i + 1);
        numbersContainer.appendChild(numberElement);
    }

    currentCount = 0;

    // Update level indicator
    document.getElementById('level-indicator').textContent = `Level ${currentLevel}`;
}

function placeObject(objectsArea, placedObjects, objectClass, objectSize, minDistance, isExtra = false) {
    const objectElement = document.createElement('i');
    objectElement.className = `object ${objectClass}`;
    objectElement.onclick = () => isExtra ? countExtraObject(objectElement) : countObject(objectElement);
    
    let position;
    let attempts = 0;
    const maxAttempts = 100;

    do {
        position = getRandomPosition(objectsArea, objectSize);
        attempts++;

        const isFarEnough = placedObjects.every(placedObj => {
            const dx = placedObj.x - position[0];
            const dy = placedObj.y - position[1];
            return Math.sqrt(dx * dx + dy * dy) >= minDistance;
        });

        if (isFarEnough || attempts >= maxAttempts) {
            break;
        }
    } while (true);

    objectElement.style.left = `${position[0]}px`;
    objectElement.style.top = `${position[1]}px`;
    
    objectsArea.appendChild(objectElement);
    placedObjects.push({ x: position[0], y: position[1], element: objectElement });
}

function countObject(element) {
    if (!element.classList.contains('counted')) {
        currentCount++;
        element.classList.add('counted');
        speak(currentCount.toString());
    }
}

function countExtraObject(element) {
    if (!element.classList.contains('counted')) {
        element.classList.add('counted');
        element.classList.add('wrong');
        element.style.color = 'red';
        element.style.opacity = '0.5';
        speak(`This is not a ${objectNames[currentObjectIndex].slice(0, -1)}, we are counting ${objectNames[currentObjectIndex]}.`);
    }
}

function checkAnswer(number) {
    const numberWords = ['one', 'two', 'three', 'four', 'five'];
    const numberWord = numberWords[number - 1];
    
    if (number === targetCount) {
        speak(`${numberWord} is correct! Well done!`);
        document.querySelectorAll('.number')[number - 1].classList.add('correct');
        correctStreak++;
        if (correctStreak === 5) {
            currentLevel = Math.min(currentLevel + 1, 5);
            correctStreak = 0;
            speak(`Great job! You've reached level ${currentLevel}!`);
        }
        setTimeout(() => {
            setupGame();
        }, 2000);
    } else {
        correctStreak = 0;
        let feedback;
        if (number < targetCount) {
            feedback = `${numberWord} is incorrect. There are more than ${numberWord} ${objectNames[currentObjectIndex]}.`;
        } else {
            feedback = `${numberWord} is incorrect. There are fewer than ${numberWord} ${objectNames[currentObjectIndex]}.`;
        }
        speak(feedback);
    }
}

function getLevelMaxObjects() {
    switch (currentLevel) {
        case 1: return 2;
        case 2: return 3;
        case 3: return 3;
        case 4: return 4;
        case 5: return 5;
        default: return 5;
    }
}

function speak(text, highlight = false) {
    const utterance = new SpeechSynthesisUtterance(text);
    if (highlight) {
        let index = 0;
        utterance.onboundary = (event) => {
            if (event.name === 'word') {
                const spans = document.querySelectorAll('#prompt span');
                spans.forEach(span => span.classList.remove('highlight'));
                if (index < spans.length) {
                    spans[index].classList.add('highlight');
                }
                index++;
            }
        };
        utterance.onend = () => {
            document.querySelectorAll('#prompt span').forEach(span => span.classList.remove('highlight'));
        };
    }
    window.speechSynthesis.speak(utterance);
}

// Initial setup
setupGame();

// Recalculate positions on window resize
window.addEventListener('resize', setupGame);