// Simple API client functions

export async function createBoard(): Promise<string> {
    const res = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) throw new Error('Failed to create board')
    const data = await res.json()
    return data.boardId
}

export async function saveBoard(boardId: string, objects: any[]): Promise<void> {
    const res = await fetch(`/api/boards/${boardId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objects })
    })
    if (!res.ok) throw new Error('Failed to save board')
}

export async function loadBoard(boardId: string): Promise<any[]> {
    const res = await fetch(`/api/boards/${boardId}`)
    if (res.status === 404) return []
    if (!res.ok) throw new Error('Failed to load board')
    const data = await res.json()
    return data.objects || []
}
