import { client } from '../api/client';

export async function fetchUsers() {
  const res = await client.get('/users');
  return res?.data?.users ?? [];
}