import {Button, Card, message, Progress, Space, Typography} from "antd";
import {CheckCircleOutlined, CloseCircleOutlined, CloseOutlined, LoadingOutlined} from "@ant-design/icons";
import type {CSSProperties} from "react";
import {useTranslation} from "react-i18next";
import {isTaskFinished, type TaskProgressResponse, TaskStatusEnum} from "../models";
import {useTaskProgress} from "./TaskProgressContext";

const {Text} = Typography;

const TRAY_STYLE: CSSProperties = {
    position: "fixed",
    right: 16,
    bottom: 16,
    width: 360,
    maxWidth: "calc(100vw - 32px)",
    maxHeight: "60vh",
    overflowY: "auto",
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    pointerEvents: "none",
};

function statusKey(status: TaskStatusEnum): string {
    switch (status) {
        case TaskStatusEnum.QUEUED:
            return "TaskProgress.queued";
        case TaskStatusEnum.RUNNING:
            return "TaskProgress.running";
        case TaskStatusEnum.COMPLETED:
            return "TaskProgress.completed";
        default:
            return "TaskProgress.failed";
    }
}

function StatusIcon({status}: { status: TaskStatusEnum }) {
    if (status === TaskStatusEnum.COMPLETED) {
        return <CheckCircleOutlined style={{color: "#52c41a"}} aria-label="completed"/>;
    }
    if (status === TaskStatusEnum.FAILED) {
        return <CloseCircleOutlined style={{color: "#ff4d4f"}} aria-label="failed"/>;
    }
    return <LoadingOutlined aria-label="running"/>;
}

export function TaskProgressCard({task, onDismiss}: { task: TaskProgressResponse; onDismiss: (taskId: string) => void }) {
    const {t} = useTranslation();
    const finished = isTaskFinished(task.status);
    const failed = task.status === TaskStatusEnum.FAILED;

    return (
            <Card
                    size="small"
                    data-testid={`task-card-${task.task_id}`}
                    data-status={task.status}
                    style={{pointerEvents: "auto", boxShadow: "0 4px 12px rgba(0,0,0,0.45)"}}
                    title={<Space size="small"><StatusIcon status={task.status}/><Text ellipsis={{tooltip: task.title}}
                                                                                       style={{maxWidth: 240}}>{task.title}</Text></Space>}
                    extra={finished && (
                            <Button
                                    type="text"
                                    size="small"
                                    icon={<CloseOutlined/>}
                                    aria-label={t("TaskProgress.close")}
                                    onClick={() => onDismiss(task.task_id)}
                            />
                    )}
            >
                <Space orientation="vertical" size={2} style={{width: "100%"}}>
                    <Progress
                            percent={task.percent}
                            size="small"
                            status={failed ? "exception" : finished ? "success" : "active"}
                    />
                    <Text type={failed ? "danger" : "secondary"} style={{fontSize: 12}}>
                        {t(statusKey(task.status))}
                        {task.total_steps > 0 && ` · ${t("TaskProgress.steps", {completed: task.completed_steps, total: task.total_steps})}`}
                        {task.failed_steps > 0 && ` · ${t("TaskProgress.failedSteps", {count: task.failed_steps})}`}
                    </Text>
                    {(failed ? task.error_message : task.message) && (
                            <Text type={failed ? "danger" : undefined} ellipsis={{tooltip: failed ? task.error_message : task.message}} style={{fontSize: 12}}>
                                {failed ? task.error_message : task.message}
                            </Text>
                    )}
                </Space>
            </Card>
    );
}

/**
 * Non-blocking stack of task cards in the lower right corner. A finished task stays visible with its completion or failure
 * message until the user closes it with the X button.
 */
export function TaskProgressTray() {
    const {t} = useTranslation();
    const {tasks, dismissTask} = useTaskProgress();

    if (tasks.length === 0) {
        return null;
    }

    const handleDismiss = (taskId: string) => {
        dismissTask(taskId)
                .catch(() => {
                    message.error(t("TaskProgress.dismissError"));
                });
    };

    return (
            <div style={TRAY_STYLE} role="region" aria-label={t("TaskProgress.title")} data-testid="task-progress-tray">
                {tasks.map(task => (
                        <TaskProgressCard key={task.task_id} task={task} onDismiss={handleDismiss}/>
                ))}
            </div>
    );
}
