export type Tribe = "Cila" | "Kalo" | "Vatu"

export type ContestantStatus = "available" | "selected" | "used" | "eliminated"

export interface Contestant {
  id: string
  name: string
  tribe: Tribe
  status: ContestantStatus
  /** Week number when this pick was used or contestant was eliminated */
  statusWeek?: number
}

export const TRIBE_COLORS: Record<Tribe, string> = {
  Cila: "#F97316",
  Kalo: "#16A34A",
  Vatu: "#BE185D",
}

export const contestants: Contestant[] = [
  // Cila (orange)
  { id: "christian", name: "Christian Hubicki", tribe: "Cila", status: "available" },
  { id: "cirie", name: "Cirie Fields", tribe: "Cila", status: "available" },
  { id: "ozzy", name: "Ozzy Lusth", tribe: "Cila", status: "available" },
  { id: "emily", name: "Emily Flippen", tribe: "Cila", status: "available" },
  { id: "rick", name: "Rick Devens", tribe: "Cila", status: "used", statusWeek: 1 },
  { id: "joe", name: "Joe Hunter", tribe: "Cila", status: "available" },
  
  // Kalo (green)
  { id: "jonathan", name: "Jonathan Young", tribe: "Kalo", status: "available" },
  { id: "dee", name: "Dee Valladares", tribe: "Kalo", status: "available" },
  { id: "mike", name: "Mike White", tribe: "Kalo", status: "available" },
  { id: "kamilla", name: "Kamilla Karthigesu", tribe: "Kalo", status: "available" },
  { id: "charlie", name: "Charlie Davis", tribe: "Kalo", status: "available" },
  { id: "tiffany", name: "Tiffany Ervin", tribe: "Kalo", status: "available" },
  { id: "coach", name: "Benjamin \"Coach\" Wade", tribe: "Kalo", status: "available" },
  { id: "chrissy", name: "Chrissy Hofbeck", tribe: "Kalo", status: "available" },
  
  // Vatu (magenta)
  { id: "colby", name: "Colby Donaldson", tribe: "Vatu", status: "eliminated", statusWeek: 1 },
  { id: "genevieve", name: "Genevieve Mushaluk", tribe: "Vatu", status: "available" },
  { id: "rizo", name: "Rizo Velovic", tribe: "Vatu", status: "available" },
  { id: "angelina", name: "Angelina Keeley", tribe: "Vatu", status: "available" },
  { id: "q", name: "Q Burdette", tribe: "Vatu", status: "available" },
  { id: "stephenie", name: "Stephenie LaGrossa Kendrick", tribe: "Vatu", status: "available" },
  { id: "aubry", name: "Aubry Bracco", tribe: "Vatu", status: "available" },
]
