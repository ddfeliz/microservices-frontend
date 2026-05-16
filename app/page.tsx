import TasksPanel from "./components/TasksPanel";
import UsersPanel from "./components/UsersPanel";
import NotifyPanel from "./components/NotifyPanel";
import ComputePanel from "./components/ComputePanel";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
          🚀 MERN Microservices — K8s Dashboard
        </h1>
        <p className="text-center text-gray-500 mb-6 text-sm">
          Gateway → service-tasks | service-users | service-notify | service-compute
        </p>
        <div className="grid grid-cols-2 gap-4">
          <TasksPanel />
          <UsersPanel />
          <NotifyPanel />
          <ComputePanel />
        </div>
      </div>
    </main>
  );
}