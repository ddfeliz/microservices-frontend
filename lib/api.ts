const GATEWAY = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:4000";

export const api = {
  tasks: {
    list: () => fetch(`${GATEWAY}/api/tasks`).then((r) => r.json()),
    create: (data: object) =>
      fetch(`${GATEWAY}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    delete: (id: string) =>
      fetch(`${GATEWAY}/api/tasks/${id}`, { method: "DELETE" }).then((r) =>
        r.json(),
      ),
  },
  users: {
    list: () => fetch(`${GATEWAY}/api/users`).then((r) => r.json()),
    create: (data: object) =>
      fetch(`${GATEWAY}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
  },
  notify: {
    list: () => fetch(`${GATEWAY}/api/notify`).then((r) => r.json()),
    create: (data: object) =>
      fetch(`${GATEWAY}/api/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
  },
  compute: {
    run: (n = 38) =>
      fetch(`${GATEWAY}/api/compute?n=${n}`).then((r) => r.json()),
  },
};
