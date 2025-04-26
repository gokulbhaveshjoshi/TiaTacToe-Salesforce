import { LightningElement, track } from 'lwc';

export default class TicTacToe extends LightningElement {
    @track board = [
        ['', '', ''],
        ['', '', ''],
        ['', '', '']
    ];
    @track currentPlayer = 'X';
    @track gameStatus = "Player X's turn";
    @track gameEnded = false;
    @track scoreX = 0;
    @track scoreO = 0;
    @track scoreTie = 0;
    @track soundEnabled = true;
    @track winningCells = [];
    @track gameMode = 'twoPlayer'; // Default to two player mode
    @track playerSymbol = 'X'; // Default player symbol
    @track computerSymbol = 'O'; // Default computer symbol
    isTwoPlayerMode = true;
    isSinglePlayerMode = false;
    // Audio context
    audioContext = null;
    
    get soundIcon() {
        return this.soundEnabled ? 'utility:volume_high' : 'utility:volume_off';
    }
    
    get soundTitle() {
        return this.soundEnabled ? 'Sound On' : 'Sound Off';
    }
    
    connectedCallback() {
        this.initializeGame();
        this.initializeAudioContext();
    }
    
    initializeAudioContext() {
        try {
            // Create audio context
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
        } catch (e) {
            console.error('Web Audio API is not supported in this browser', e);
            this.soundEnabled = false;
        }
    }
    
    // Generate different sound types
    playClickSound() {
        if (!this.soundEnabled || !this.audioContext) return;
        
        this.playTone(600, 0.05, 'square');
    }
    
    playWinSound() {
        if (!this.soundEnabled || !this.audioContext) return;
        
        // Play a win melody
        this.playTone(500, 0.1, 'sine');
        setTimeout(() => this.playTone(600, 0.1, 'sine'), 100);
        setTimeout(() => this.playTone(700, 0.1, 'sine'), 200);
        setTimeout(() => this.playTone(800, 0.2, 'sine'), 300);
    }
    
    playLoseSound() {
        if (!this.soundEnabled || !this.audioContext) return;
        
        // Play a descending melody for losing
        this.playTone(700, 0.1, 'sine');
        setTimeout(() => this.playTone(600, 0.1, 'sine'), 100);
        setTimeout(() => this.playTone(500, 0.1, 'sine'), 200);
        setTimeout(() => this.playTone(400, 0.2, 'sine'), 300);
    }
    
    playTieSound() {
        if (!this.soundEnabled || !this.audioContext) return;
        
        // Play a two-tone signal for tie
        this.playTone(400, 0.15, 'triangle');
        setTimeout(() => this.playTone(350, 0.15, 'triangle'), 200);
    }
    
    playNewGameSound() {
        if (!this.soundEnabled || !this.audioContext) return;
        
        // Play a sweep for new game
        this.playTone(350, 0.1, 'sine');
        setTimeout(() => this.playTone(400, 0.1, 'sine'), 100);
        setTimeout(() => this.playTone(450, 0.1, 'sine'), 200);
    }
    
    playTone(frequency, duration, type = 'sine') {
        try {
            // Resume audio context if it was suspended (browser autoplay policy)
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            // Create oscillator
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            // Set up oscillator
            oscillator.type = type;
            oscillator.frequency.value = frequency;
            
            // Set up gain (volume)
            gainNode.gain.value = 0.3;
            
            // Add fade out effect
            gainNode.gain.exponentialRampToValueAtTime(
                0.01, this.audioContext.currentTime + duration
            );
            
            // Connect nodes
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Start & stop
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (e) {
            console.error('Error playing tone:', e);
        }
    }
    
    playSound(soundType) {
        if (!this.soundEnabled) return;
        
        switch (soundType) {
            case 'click':
                this.playClickSound();
                break;
            case 'win':
                this.playWinSound();
                break;
            case 'lose':
                this.playLoseSound();
                break;
            case 'tie':
                this.playTieSound();
                break;
            case 'newGame':
                this.playNewGameSound();
                break;
        }
    }
    
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        // Play a sound when turning sound back on as feedback
        if (this.soundEnabled) {
            this.playSound('click');
        }
    }
    
    // Handle game mode change
    handleModeChange(event) {
        this.gameMode = event.target.value;
        this.isTwoPlayerMode = this.gameMode == 'twoPlayer';
        this.isSinglePlayerMode = this.gameMode == 'singlePlayer';
        this.startNewGame();
    }
    
    initializeGame() {
        const newBoard = [
            ['', '', ''],
            ['', '', ''],
            ['', '', '']
        ];
        this.board = JSON.parse(JSON.stringify(newBoard));
        this.currentPlayer = 'X';
        this.gameStatus = "Player X's turn";
        this.gameEnded = false;
        this.winningCells = [];
        console.log(JSON.stringify(this.board));
        console.log(this.currentPlayer, this.gameStatus, this.gameEnded, this.winningCells);
        // If computer goes first in single player mode
        if (this.gameMode === 'singlePlayer' && this.computerSymbol === 'X') {
            this.makeComputerMove();
        }
    }
    
    handleCellClick(event) {
        if (this.gameEnded) return;
        
        const row = parseInt(event.currentTarget.dataset.row, 10);
        const col = parseInt(event.currentTarget.dataset.col, 10);
        
        // Check if cell is already filled
        if (this.board[row][col] !== '') return;
        
        // Play click sound
        this.playSound('click');
        
        // Update board with player's move
        this.board[row][col] = this.currentPlayer;
        
        // Force UI update by creating a new array reference
        this.board = [...this.board];
        
        // Check for winner
        const result = this.checkWinner();
        
        if (result.winner) {
            this.handleGameEnd(result);
        } else {
            // Switch player
            this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
            this.gameStatus = `Player ${this.currentPlayer}'s turn`;
            
            // If in single player mode and it's computer's turn
            if (this.gameMode === 'singlePlayer' && this.currentPlayer === this.computerSymbol) {
                // Slight delay before computer moves
                setTimeout(() => {
                    this.makeComputerMove();
                }, 500);
            }
        }
    }
    
    handleGameEnd(result) {
        this.gameEnded = true;
        
        if (result.winner === 'tie') {
            this.gameStatus = "Game ended in a tie!";
            this.scoreTie++;
            this.playSound('tie');
            this.animateTie();
        } else {
            this.winningCells = result.winningCells;
            
            if (this.gameMode === 'singlePlayer') {
                if (result.winner === this.playerSymbol) {
                    this.gameStatus = "You win!";
                    this.scoreX++;
                    this.playSound('win');
                    this.animateWin();
                } else {
                    this.gameStatus = "Computer wins!";
                    this.scoreO++;
                    this.playSound('lose');
                    this.animateLose();
                }
            } else {
                this.gameStatus = `Player ${result.winner} wins!`;
                
                if (result.winner === 'X') {
                    this.scoreX++;
                    this.playSound('win');
                    this.animateWin();
                } else {
                    this.scoreO++;
                    this.playSound('lose');
                    this.animateLose();
                }
            }
        }
    }
    
    makeComputerMove() {
        console.log('this is make computer move');
        if (this.gameEnded) return;
        
        // Play click sound for computer move
        this.playSound('click');
        
        // Find best move using minimax algorithm
        const bestMove = this.findBestMove();
        
        // Make the move
        this.board[bestMove.row][bestMove.col] = this.computerSymbol;
        
        // Force UI update by creating a new array reference
        this.board = [...this.board];
        
        // Check for winner
        const result = this.checkWinner();
        
        if (result.winner) {
            this.handleGameEnd(result);
        } else {
            // Switch back to player
            this.currentPlayer = this.playerSymbol;
            this.gameStatus = "Your turn";
        }
    }
    
    findBestMove() {
        // First check if we can win in one move
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (this.board[i][j] === '') {
                    // Try this move
                    this.board[i][j] = this.computerSymbol;
                    
                    // Check if it's a winning move
                    const result = this.checkWinner();
                    
                    // Undo the move
                    this.board[i][j] = '';
                    
                    if (result.winner === this.computerSymbol) {
                        return { row: i, col: j };
                    }
                }
            }
        }
        
        // Then check if player can win in one move and block it
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (this.board[i][j] === '') {
                    // Try this move as if player would make it
                    this.board[i][j] = this.playerSymbol;
                    
                    // Check if it would be a winning move for player
                    const result = this.checkWinner();
                    
                    // Undo the move
                    this.board[i][j] = '';
                    
                    if (result.winner === this.playerSymbol) {
                        return { row: i, col: j };
                    }
                }
            }
        }
        
        // Take center if available
        if (this.board[1][1] === '') {
            return { row: 1, col: 1 };
        }
        
        // Take corners if available
        const corners = [
            { row: 0, col: 0 },
            { row: 0, col: 2 },
            { row: 2, col: 0 },
            { row: 2, col: 2 }
        ];
        
        const availableCorners = corners.filter(
            corner => this.board[corner.row][corner.col] === ''
        );
        
        if (availableCorners.length > 0) {
            // Choose a random available corner
            const randomIndex = Math.floor(Math.random() * availableCorners.length);
            return availableCorners[randomIndex];
        }
        
        // Take any available edge
        const edges = [
            { row: 0, col: 1 },
            { row: 1, col: 0 },
            { row: 1, col: 2 },
            { row: 2, col: 1 }
        ];
        
        const availableEdges = edges.filter(
            edge => this.board[edge.row][edge.col] === ''
        );
        
        if (availableEdges.length > 0) {
            // Choose a random available edge
            const randomIndex = Math.floor(Math.random() * availableEdges.length);
            return availableEdges[randomIndex];
        }
        
        // If we get here, there's no move to make (shouldn't happen)
        return null;
    }
    
    checkWinner() {
        const board = this.board;
        const result = { winner: null, winningCells: [] };
        
        // Check rows
        for (let i = 0; i < 3; i++) {
            if (board[i][0] !== '' && board[i][0] === board[i][1] && board[i][1] === board[i][2]) {
                result.winner = board[i][0];
                result.winningCells = [[i, 0], [i, 1], [i, 2]];
                return result;
            }
        }
        
        // Check columns
        for (let i = 0; i < 3; i++) {
            if (board[0][i] !== '' && board[0][i] === board[1][i] && board[1][i] === board[2][i]) {
                result.winner = board[0][i];
                result.winningCells = [[0, i], [1, i], [2, i]];
                return result;
            }
        }
        
        // Check diagonals
        if (board[0][0] !== '' && board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
            result.winner = board[0][0];
            result.winningCells = [[0, 0], [1, 1], [2, 2]];
            return result;
        }
        
        if (board[0][2] !== '' && board[0][2] === board[1][1] && board[1][1] === board[2][0]) {
            result.winner = board[0][2];
            result.winningCells = [[0, 2], [1, 1], [2, 0]];
            return result;
        }
        
        // Check for tie
        let isTie = true;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[i][j] === '') {
                    isTie = false;
                    break;
                }
            }
        }
        
        if (isTie) {
            result.winner = 'tie';
        }
        
        return result;
    }
    
    isCellWinning(row, col) {
        return this.winningCells.some(cell => cell[0] === row && cell[1] === col);
    }
    
    getCellClass(row, col) {
        let classes = 'board-cell';
        
        if (this.isCellWinning(row, col)) {
            classes += ' winning-cell';
        }
        
        return classes;
    }
    
    animateWin() {
        // Add animation class to game board
        const gameBoard = this.template.querySelector('.game-board');
        gameBoard.classList.add('win-animation');
        
        // Add winning status animation
        const statusElem = this.template.querySelector('.game-status');
        statusElem.classList.add('win-text');
    }
    
    animateLose() {
        // Add animation class to game board
        const gameBoard = this.template.querySelector('.game-board');
        gameBoard.classList.add('lose-animation');
        
        // Add losing status animation
        const statusElem = this.template.querySelector('.game-status');
        statusElem.classList.add('lose-text');
    }
    
    animateTie() {
        // Add animation class to game board
        const gameBoard = this.template.querySelector('.game-board');
        gameBoard.classList.add('tie-animation');
        
        // Add tie status animation
        const statusElem = this.template.querySelector('.game-status');
        statusElem.classList.add('tie-text');
    }
    
    startNewGame() {
        this.playSound('newGame');
        
        // Check if elements exist before accessing classList
        const gameBoard = this.template.querySelector('.game-board');
        if (gameBoard) {
            gameBoard.classList.remove('win-animation', 'lose-animation', 'tie-animation');
        }
        
        const statusElem = this.template.querySelector('.game-status');
        if (statusElem) {
            statusElem.classList.remove('win-text', 'lose-text', 'tie-text');
        }
        
        this.initializeGame();
    }
    
    countMoves(player) {
        let count = 0;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (this.board[i][j] === player) {
                    count++;
                }
            }
        }
        return count;
    }
}