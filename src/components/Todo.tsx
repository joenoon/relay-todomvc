import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { createFragmentContainer, graphql } from 'react-relay';

import ChangeTodoStatusMutation from '../mutations/ChangeTodoStatusMutation';
import RemoveTodoMutation from '../mutations/RemoveTodoMutation';
import RenameTodoMutation from '../mutations/RenameTodoMutation';
import TodoTextInput from './TodoTextInput';

import {Todo_todo} from '../__generated__/Todo_todo.graphql';
import {Todo_viewer} from '../__generated__/Todo_viewer.graphql';

interface Props {
  viewer: Todo_viewer;
  todo: Todo_todo;
  relay: any;
}  

interface State {
  isEditing: boolean;
}

class Todo extends React.Component<Props, State> {
  constructor(props: Props, context: any) {
    super(props, context);

    this.state = {
      isEditing: false,
    };
  }

  onCompleteChange = e => {
    const { relay, viewer, todo } = this.props;
    const complete = e.target.checked;

    ChangeTodoStatusMutation.commit(relay.environment, viewer, todo, complete);
  };

  onDestroyClick = () => {
    this.removeTodo();
  };

  onLabelDoubleClick = () => {
    this.setEditMode(true);
  };

  onTextInputCancel = () => {
    this.setEditMode(false);
  };

  onTextInputDelete = () => {
    this.setEditMode(false);
    this.removeTodo();
  };

  onTextInputSave = text => {
    const { relay, todo } = this.props;

    this.setEditMode(false);

    RenameTodoMutation.commit(relay.environment, todo, text);
  };

  setEditMode(isEditing) {
    this.setState({ isEditing });
  }

  removeTodo() {
    const { relay, viewer, todo } = this.props;

    RemoveTodoMutation.commit(relay.environment, viewer, todo);
  }

  render() {
    const { complete, text } = this.props.todo;
    const { isEditing } = this.state;

    /* eslint-disable jsx-a11y/label-has-for */
    return (
      <li
        className={classNames({
          completed: complete,
          editing: isEditing,
        })}
      >
        <div className="view">
          <input
            type="checkbox"
            checked={complete}
            className="toggle"
            onChange={this.onCompleteChange}
          />
          <label onDoubleClick={this.onLabelDoubleClick}>{text}</label>
          <button className="destroy" onClick={this.onDestroyClick} />
        </div>

        {!!this.state.isEditing && (
          <TodoTextInput
            className="edit"
            commitOnBlur
            initialValue={this.props.todo.text}
            onCancel={this.onTextInputCancel}
            onDelete={this.onTextInputDelete}
            onSave={this.onTextInputSave}
          />
        )}
      </li>
    );
    /* eslint-enable jsx-a11y/label-has-for */
  }
}


export default createFragmentContainer(Todo, {
  viewer: graphql`
    fragment Todo_viewer on User {
      id
    }
  `,
  todo: graphql`
    fragment Todo_todo on Todo {
      id
      complete
      text
    }
  `,
});
