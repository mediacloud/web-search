import React from 'react';
import PropTypes from 'prop-types';
import CircularProgress from '@mui/material/CircularProgress';
import dayjs from 'dayjs';
import { useGetPendingTasksQuery, useGetCompletedTasksQuery } from '../../app/services/sourceApi';

export default function TaskList({ completed }) {
  const title = completed ? 'Completed Tasks' : 'Tasks in Progress';

  const {
    data,
    isLoading: tasksLoading,
  } = completed ? useGetCompletedTasksQuery() : useGetPendingTasksQuery();

  if (!data) return null;

  if (tasksLoading) {
    return (
      <div>
        <CircularProgress size="75px" />
      </div>
    );
  }

  const tasks = completed ? data.completed_tasks : data.tasks;

  if (tasks.length === 0) {
    return (
      <div className="container">
        {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
        <h1 className="feed-story-title">No {title}</h1>
      </div>
    );
  }
  return (
    <div className="container">
      <div className="row">
        <div className="col-12">
          <h1 id="feed-story-title">{title}</h1>
        </div>
        <div className="row">

          <div className="col-12">
            <table className="feed-stories">
              <thead>

                <tr className="row">
                  <th className="col-9">Name</th>
                  <th className="col-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id} className="row">
                    <td className="col-8">{task.verbose_name}</td>
                    <td className="col-4">{dayjs(task.run_at).format('MM-DD-YY')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

TaskList.propTypes = {
  completed: PropTypes.bool.isRequired,
};
