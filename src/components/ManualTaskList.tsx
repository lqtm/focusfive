import type { Category, Task, TaskBucket } from '../domain/models';
import { TaskRow } from './TaskRow';

interface ManualTaskListProps {
  tasks: Task[];
  categories: Category[];
  sourceBucket: 'today' | 'later';
  onComplete: (taskId: string) => void;
  onMove: (taskId: string, bucket: TaskBucket) => void;
  onReorder: (taskId: string, direction: 'up' | 'down') => void;
}

export function ManualTaskList({ tasks, categories, sourceBucket, onComplete, onMove, onReorder }: ManualTaskListProps) {
  const targetBucket: TaskBucket = sourceBucket === 'today' ? 'later' : 'today';

  return (
    <ul className={sourceBucket === 'later' ? 'task-list later-list' : 'task-list'}>
      {tasks.map((task, index) => (
        <TaskRow
          key={task.id}
          item={task}
          category={categories.find((category) => category.id === task.categoryId)}
          sourceBucket={sourceBucket}
          onComplete={() => onComplete(task.id)}
          onMove={() => onMove(task.id, targetBucket)}
          onMoveUp={() => onReorder(task.id, 'up')}
          onMoveDown={() => onReorder(task.id, 'down')}
          canMoveUp={index > 0}
          canMoveDown={index < tasks.length - 1}
        />
      ))}
    </ul>
  );
}
