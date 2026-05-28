export type SudokuDifficulty = 'easy' | 'medium' | 'hard' | 'expert'
export type SudokuGrid = number[][]

const DIFFICULTY_HOLES: Record<SudokuDifficulty, number> = {
  easy: 40,
  medium: 48,
  hard: 53,
  expert: 57,
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = a[i]!
    a[i] = a[j]!
    a[j] = tmp
  }
  return a
}

function isValidPlacement(grid: SudokuGrid, row: number, col: number, num: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (grid[row]![i] === num) return false
    if (grid[i]![col] === num) return false
  }
  const br = Math.floor(row / 3) * 3
  const bc = Math.floor(col / 3) * 3
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      if (grid[r]![c] === num) return false
    }
  }
  return true
}

function fillBox(grid: SudokuGrid, startRow: number, startCol: number) {
  const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])
  let k = 0
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      grid[startRow + r]![startCol + c] = nums[k++]!
    }
  }
}

function fillGrid(grid: SudokuGrid): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r]![c] === 0) {
        const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])
        for (const n of nums) {
          if (isValidPlacement(grid, r, c, n)) {
            grid[r]![c] = n
            if (fillGrid(grid)) return true
            grid[r]![c] = 0
          }
        }
        return false
      }
    }
  }
  return true
}

export function generateSudoku(difficulty: SudokuDifficulty): { puzzle: SudokuGrid, solution: SudokuGrid } {
  const grid: SudokuGrid = Array.from({ length: 9 }, () => Array(9).fill(0))
  fillBox(grid, 0, 0)
  fillBox(grid, 3, 3)
  fillBox(grid, 6, 6)
  fillGrid(grid)
  const solution: SudokuGrid = grid.map(r => [...r])
  const puzzle: SudokuGrid = grid.map(r => [...r])
  const positions = shuffle(Array.from({ length: 81 }, (_, i) => i))
  const holes = DIFFICULTY_HOLES[difficulty]
  for (let i = 0; i < holes; i++) {
    const pos = positions[i]!
    const r = Math.floor(pos / 9)
    const c = pos % 9
    puzzle[r]![c] = 0
  }
  return { puzzle, solution }
}
