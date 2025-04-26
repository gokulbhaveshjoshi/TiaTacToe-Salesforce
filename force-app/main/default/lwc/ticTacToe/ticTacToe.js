import { LightningElement, track, api } from 'lwc';

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
    
    @api recordId; // For saving results related to a record if needed
    
    connectedCallback() {
        this.initializeGame();
    }
    
    initializeGame() {
        this.board = [
            ['', '', ''],
            ['', '', ''],
            ['', '', '']
        ];
        this.currentPlayer = 'X';
        this.gameStatus = "Player X's turn";
        this.gameEnded = false;
    }
    
    handleCellClick(event) {
        if (this.gameEnded) return;
        
        const row = parseInt(event.currentTarget.dataset.row, 10);
        const col = parseInt(event.currentTarget.dataset.col, 10);
        
        // Check if cell is already filled
        if (this.board[row][col] !== '') return;
        
        // Update board
        this.board[row][col] = this.currentPlayer;
        
        // Force UI update by creating a new array reference
        this.board = [...this.board];
        
        // Check for winner
        const winner = this.checkWinner();
        
        if (winner) {
            this.gameEnded = true;
            if (winner === 'tie') {
                this.gameStatus = "Game ended in a tie!";
                this.scoreTie++;
            } else {
                this.gameStatus = `Player ${winner} wins!`;
                if (winner === 'X') {
                    this.scoreX++;
                } else {
                    this.scoreO++;
                }
            }
            
            // Save game result
            this.saveResult(winner);
            
        } else {
            // Switch player
            this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
            this.gameStatus = `Player ${this.currentPlayer}'s turn`;
        }
    }
    
    checkWinner() {
        const board = this.board;
        
        // Check rows
        for (let i = 0; i < 3; i++) {
            if (board[i][0] !== '' && board[i][0] === board[i][1] && board[i][1] === board[i][2]) {
                return board[i][0];
            }
        }
        
        // Check columns
        for (let i = 0; i < 3; i++) {
            if (board[0][i] !== '' && board[0][i] === board[1][i] && board[1][i] === board[2][i]) {
                return board[0][i];
            }
        }
        
        // Check diagonals
        if (board[0][0] !== '' && board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
            return board[0][0];
        }
        
        if (board[0][2] !== '' && board[0][2] === board[1][1] && board[1][1] === board[2][0]) {
            return board[0][2];
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
        
        if (isTie) return 'tie';
        
        return null;
    }
    
    startNewGame() {
        this.initializeGame();
    }
    
    saveResult(result) {
        /*saveGameResult({ 
            winner: result === 'tie' ? 'Tie' : result,
            xMoves: this.countMoves('X'),
            oMoves: this.countMoves('O'),
            recordId: this.recordId
        })
        .then(response => {
            console.log('Game result saved:', response);
        })
        .catch(error => {
            console.error('Error saving game result:', error);
        });*/
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