"use client";
import { useState, useEffect } from "react";
import { api } from "../../lib/api";

export default function UsersPanel() {
    const [users, setUsers] = useState<{ _id: string; name: string; email: string; role: string; createdAt: Date }[]>([]);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    const load = async () => setUsers(await api.users.list());
    useEffect(() => {
        const fetchUsers = async () => {
            const userList = await api.users.list();
            setUsers(userList);
        };
        fetchUsers();
    }, []);

    const add = async () => {
        if (!name.trim() || !email.trim()) return;
        await api.users.create({ name, email });
        setName(""); setEmail("");
        await load();
    };

    return (
        <div className="border rounded-lg p-4 bg-white shadow">
            <h2 className="text-lg font-bold mb-3 text-green-600">👤 Users ({users.length})</h2>
            <div className="flex flex-col gap-2 mb-3">
                <input className="border rounded px-2 py-1 text-sm" placeholder="Nom" value={name} onChange={e => setName(e.target.value)} />
                <div className="flex gap-2">
                    <input className="border rounded px-2 py-1 flex-1 text-sm" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                    <button onClick={add} className="bg-green-500 text-white px-3 py-1 rounded text-sm">+</button>
                </div>
            </div>
            <ul className="space-y-1 max-h-40 overflow-y-auto">
                {users.map((u: { _id: string; name: string; email: string; role: string; createdAt: Date }) => (
                    <li key={u._id} className="text-sm bg-gray-50 px-2 py-1 rounded">
                        <span className="font-medium">{u.name}</span> — <span className="text-gray-500">{u.email}</span>
                        <span className="text-gray-500">({u.role})</span>
                        <span className="text-gray-500">({u.createdAt.toLocaleString()})</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}