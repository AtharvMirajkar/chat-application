import React from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Collapse,
  IconButton,
} from "@mui/material";
import { Circle, ExpandMore, ExpandLess, People } from "@mui/icons-material";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { setSelectedUser } from "../../features/chat/chatSlice";

interface OnlineUsersProps {
  collapsed?: boolean;
}

const OnlineUsers: React.FC<OnlineUsersProps> = ({ collapsed = false }) => {
  const [expanded, setExpanded] = React.useState(!collapsed);
  const dispatch = useAppDispatch();
  const { onlineUsers, selectedUser } = useAppSelector((state) => state.chat);
  const { user } = useAppSelector((state) => state.auth);
  const { isGuestMode, sessionId } = useAppSelector((state) => state.guest);
  const loggedInUserId = user?.id;

  let filteredUsers = onlineUsers;
  if (isGuestMode) {
    filteredUsers = onlineUsers.filter(
      (u) =>
        u.userId !== loggedInUserId &&
        u.userId &&
        sessionId &&
        u.userId !== undefined &&
        u.sessionId === sessionId
    );
  } else {
    filteredUsers = onlineUsers.filter(
      (u) => u.userId !== loggedInUserId && !u.isGuest
    );
  }

  const handleSelectUser = (user: (typeof onlineUsers)[0]) => {
    dispatch(setSelectedUser(user));
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <Paper
      sx={{
        m: 1,
        overflow: "hidden",
        borderRadius: 2,
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          p: 1,
          bgcolor: "primary.main",
          color: "primary.contrastText",
          cursor: collapsed ? "pointer" : "default",
        }}
        onClick={collapsed ? toggleExpanded : undefined}
      >
        <People sx={{ mr: 1 }} />
        <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
          Online ({filteredUsers.length})
        </Typography>
        {collapsed && (
          <IconButton
            size="small"
            sx={{ color: "inherit" }}
            onClick={toggleExpanded}
          >
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        )}
      </Box>
      <Collapse in={expanded} sx={{ flex: 1 }}>
        <List dense sx={{ maxHeight: 200, overflow: "auto" }}>
          {filteredUsers.length === 0 ? (
            <ListItem>
              <ListItemText
                primary="No users online"
                sx={{ textAlign: "center", opacity: 0.6 }}
              />
            </ListItem>
          ) : (
            filteredUsers.map((user, index) => (
              <ListItem
                key={user.userId}
                button
                selected={selectedUser?.userId === user.userId}
                onClick={() => handleSelectUser(user)}
                sx={{
                  bgcolor:
                    selectedUser?.userId === user.userId
                      ? "action.selected"
                      : undefined,
                  borderRadius: 1,
                  mb: 0.5,
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Circle
                    sx={{
                      fontSize: 12,
                      color: "success.main",
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={user.username}
                  primaryTypographyProps={{
                    variant: "body2",
                  }}
                />
              </ListItem>
            ))
          )}
        </List>
      </Collapse>
      {/* Show your own profile at the bottom */}
      {user?.username && (
        <Box sx={{ p: 2, borderTop: 1, borderColor: "divider", mt: "auto" }}>
          <Typography variant="body2" color="text.secondary">
            You: <b>{user.username}</b>
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default OnlineUsers;
