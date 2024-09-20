const objects = [
    'fas fa-star', 'fas fa-heart', 'fas fa-bell', 'fas fa-apple-alt', 'fas fa-car',
    'fas fa-sun', 'fas fa-moon', 'fas fa-cloud', 'fas fa-umbrella', 'fas fa-tree',
    'fas fa-fish', 'fas fa-dog', 'fas fa-cat', 'fas fa-horse',
    'fas fa-ice-cream', 'fas fa-cookie', 'fas fa-candy-cane', 'fas fa-lemon', 'fas fa-carrot',
    'fas fa-bicycle', 'fas fa-bus', 'fas fa-train', 'fas fa-plane', 'fas fa-ship'
];
const objectNames = [
    'stars', 'hearts', 'bells', 'apples', 'cars',
    'suns', 'moons', 'clouds', 'umbrellas', 'trees',
    'fish', 'dogs', 'cats', 'horses',
    'ice creams', 'cookies', 'candy canes', 'lemons', 'carrots',
    'bicycles', 'buses', 'trains', 'planes', 'ships'
];
const diceIcons = ['fa-solid fa-square', 'fas fa-dice-one', 'fas fa-dice-two', 'fas fa-dice-three', 'fas fa-dice-four', 'fas fa-dice-five'];
let currentCount = 0;
let targetCount = 0;
let currentObjectIndex = 0;
let currentLevel = 1;
let correctStreak = 0;
let firstAttempt = true;
let isClickable = true;

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

async function setupGame() {
    await fadeOut();

    const promptElement = document.getElementById('prompt');
    const objectsArea = document.getElementById('objects-area');
    const numbersContainer = document.getElementById('numbers');
    
    targetCount = generateRandomNumber(0, getLevelMaxObjects());
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
        const extraObjects = generateRandomNumber(0, currentLevel >= 4 ? 3 : 2);
        for (let i = 0; i < extraObjects; i++) {
            let extraObjectIndex;
            do {
                extraObjectIndex = Math.floor(Math.random() * objects.length);
            } while (extraObjectIndex === currentObjectIndex);
            placeObject(objectsArea, placedObjects, objects[extraObjectIndex], objectSize, minDistance, true);
        }
    }

    numbersContainer.innerHTML = '';
    for (let i = 0; i <= 6; i++) {
        const numberElement = document.createElement('div');
        numberElement.className = 'number';
        numberElement.innerHTML = `
            <i class="${diceIcons[i]}"></i>
            <span class="arabic">${i}</span>
        `;
        numberElement.onclick = () => checkAnswer(i);
        if (i > getLevelMaxObjects()) {
            numberElement.classList.add('hidden');
        }
        numbersContainer.appendChild(numberElement);
    }

    currentCount = 0;

    // Update level indicator
    document.getElementById('level-indicator').textContent = `Level ${currentLevel}`;

    await fadeIn();
    firstAttempt = true;  // Reset firstAttempt for each new game
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

async function checkAnswer(number) {
    if (!isClickable) return;

    const numberWords = ['zero', 'one', 'two', 'three', 'four', 'five'];
    const numberWord = numberWords[number];
    
    if (number === targetCount) {
        speak(`${numberWord} is correct! Well done!`);
        document.querySelectorAll('.number')[number].classList.add('correct');
        
        if (firstAttempt) {
            correctStreak++;
            if (correctStreak === 5) {
                await fadeOut();
                currentLevel = Math.min(currentLevel + 1, 6);
                correctStreak = 0;
                speak(`Great job! You've reached level ${currentLevel}!`);
                updateVisibleNumbers();
                await fadeIn();
            }
        }
        
        setTimeout(async () => {
            await setupGame();
        }, 2000);
    } else {
        isClickable = false;
        correctStreak = 0;
        let feedback;
        if (number < targetCount) {
            feedback = `${numberWord} is incorrect. There are more than ${numberWord} ${objectNames[currentObjectIndex]}.`;
        } else {
            feedback = `${numberWord} is incorrect. There are fewer than ${numberWord} ${objectNames[currentObjectIndex]}.`;
        }
        speak(feedback);

        // Disable clicking for 5 seconds
        document.querySelectorAll('.number').forEach(el => el.classList.add('disabled'));
        setTimeout(() => {
            isClickable = true;
            document.querySelectorAll('.number').forEach(el => el.classList.remove('disabled'));
        }, 5000);
    }
    firstAttempt = false;
}

function getLevelMaxObjects() {
    switch (currentLevel) {
        case 1: return 2;
        case 2: return 3;
        case 3: return 3;
        case 4: return 4;
        case 5: return 5;
        case 6: return 6;
        default: return 6;
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

function fadeOut() {
    return new Promise(resolve => {
        const overlay = document.getElementById('transition-overlay');
        overlay.classList.add('active');
        setTimeout(resolve, 1500);
    });
}

function fadeIn() {
    return new Promise(resolve => {
        const overlay = document.getElementById('transition-overlay');
        overlay.classList.remove('active');
        setTimeout(resolve, 1500);
    });
}

// Add this new function
function updateVisibleNumbers() {
    const maxObjects = getLevelMaxObjects();
    const numberElements = document.querySelectorAll('.number');
    numberElements.forEach((element, index) => {
        if (index <= maxObjects) {
            element.classList.remove('hidden');
        } else {
            element.classList.add('hidden');
        }
    });
}

// Initial setup
(async function() {
    await setupGame();
    updateVisibleNumbers();
})();

// Recalculate positions on window resize
window.addEventListener('resize', async () => await setupGame());