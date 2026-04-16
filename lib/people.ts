export type PersonRecord = {
  id: number;
  name: string;
  created_at?: string;
};

export type Person = {
  id: number;
  name: string;
};

export const initialDevOpsResources: Person[] = [
  { id: 1, name: "Maya Chen" },
  { id: 2, name: "Rohan Patel" },
  { id: 3, name: "Elena Brooks" },
  { id: 4, name: "James Kim" },
];

export const initialRequesters: Person[] = [
  { id: 1, name: "Nina Alvarez" },
  { id: 2, name: "Owen Blake" },
  { id: 3, name: "Priya D'Souza" },
  { id: 4, name: "Liam Porter" },
  { id: 5, name: "Ava Singh" },
  { id: 6, name: "Marcus Lee" },
  { id: 7, name: "Sofia Grant" },
  { id: 8, name: "Ethan Cole" },
  { id: 9, name: "Resource Planner" },
];

export function toPerson(record: PersonRecord): Person {
  return {
    id: record.id,
    name: record.name,
  };
}
