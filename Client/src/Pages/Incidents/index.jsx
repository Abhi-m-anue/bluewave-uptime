import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Typography, ButtonGroup, Stack, Box, Skeleton } from "@mui/material";
import WestRoundedIcon from "@mui/icons-material/WestRounded";
import Button from "../../Components/Button";
import axiosInstance from "../../Utils/axiosConfig";
import BasicTable from "../../Components/BasicTable";
import { StatusLabel } from "../../Components/Label";
import { useTheme } from "@emotion/react";
import { useNavigate } from "react-router";
import Select from "../../Components/Inputs/Select";

import "./index.css";

const Incidents = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const authState = useSelector((state) => state.auth);
  const [monitors, setMonitors] = useState({});
  const [selectedMonitor, setSelectedMonitor] = useState("0");
  const [loading, setLoading] = useState(false);

  // TODO do something with these filters
  const [filter, setFilter] = useState("all");

  let data = {
    cols: [
      { id: 1, name: "Status" },
      { id: 2, name: "Timestamp" },
      { id: 3, name: "Monitor" },
      { id: 4, name: "Message" },
    ],
    rows: [],
  };

  useEffect(() => {
    const fetchIncidents = async () => {
      setLoading(true);
      const res = await axiosInstance.get(
        `/monitors/user/${authState.user._id}?status=false`,
        {
          headers: {
            Authorization: `Bearer ${authState.authToken}`,
          },
        }
      );

      // Reduce to a lookup object for 0(1) lookup
      if (res.data && res.data.data.length > 0) {
        const monitorLookup = res.data.data.reduce((acc, monitor) => {
          acc[monitor._id] = monitor;
          return acc;
        }, {});
        setMonitors(monitorLookup);
      }
      setLoading(false);
    };

    fetchIncidents();
  }, [authState]);

  const handleSelect = (event) => {
    setSelectedMonitor(event.target.value);
  };
  let incidents = [];
  let hasAnyIncidents = false;
  let hasSpecificIncidents = false;
  if (selectedMonitor === "0") {
    Object.values(monitors).forEach((monitor) => {
      incidents = incidents.concat(monitor.checks);
    });
    if (incidents.length !== 0) hasAnyIncidents = true;
    hasSpecificIncidents = hasAnyIncidents;
  } else {
    const monitor = monitors[selectedMonitor];
    incidents = monitor.checks;
    if (incidents.length !== 0) hasSpecificIncidents = true;
    hasAnyIncidents = true;
  }
  incidents = incidents
    .sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    })
    .filter((incident) => {
      if (filter === "all") return true;
      else if (filter === "resolve") return incident.statusCode === 5000;
      else if (filter === "down") return incident.status === false;
    })
    .map((incident, idx) => {
      return {
        id: idx,
        data: [
          {
            id: idx + 0,
            data: <StatusLabel status="down" text="Down" />,
          },
          { id: idx + 1, data: new Date(incident.createdAt).toLocaleString() },
          { id: idx + 2, data: monitors[incident.monitorId].name },
          { id: idx + 3, data: incident.statusCode },
        ],
      };
    });
  data.rows = incidents;

  return (
    <>
      <Stack className="incidents" gap={theme.gap.large}>
        {loading ? (
          <>
            <Stack direction="row" alignItems="center" gap={theme.gap.medium}>
              <Skeleton variant="rounded" width={150} height={34} />
              <Skeleton variant="rounded" width="15%" height={34} />
              <Skeleton
                variant="rounded"
                width="20%"
                height={34}
                sx={{ ml: "auto" }}
              />
            </Stack>
            <Skeleton variant="rounded" width="100%" height={300} />
            <Skeleton variant="rounded" width="100%" height={100} />
          </>
        ) : hasAnyIncidents ? (
          <>
            <Stack direction="row" alignItems="center" gap={theme.gap.medium}>
              <Typography component="h1">Incident history for: </Typography>
              <Select
                id="incidents-select-monitor"
                placeholder="All servers"
                value={selectedMonitor}
                onChange={handleSelect}
                items={Object.values(monitors)}
              />
              {hasAnyIncidents && hasSpecificIncidents && (
                <ButtonGroup sx={{ ml: "auto" }}>
                  <Button
                    level="secondary"
                    label="All"
                    onClick={() => setFilter("all")}
                    sx={{
                      backgroundColor:
                        filter === "all" && theme.palette.otherColors.fillGray,
                    }}
                  />
                  <Button
                    level="secondary"
                    label="Down"
                    onClick={() => setFilter("down")}
                    sx={{
                      backgroundColor:
                        filter === "down" && theme.palette.otherColors.fillGray,
                    }}
                  />
                  <Button
                    level="secondary"
                    label="Cannot Resolve"
                    onClick={() => setFilter("resolve")}
                    sx={{
                      backgroundColor:
                        filter === "resolve" &&
                        theme.palette.otherColors.fillGray,
                    }}
                  />
                </ButtonGroup>
              )}
            </Stack>
            {hasAnyIncidents && hasSpecificIncidents ? (
              <BasicTable data={data} paginated={true} rowsPerPage={12} />
            ) : (
              <Typography alignSelf="center" mt={theme.gap.xxl}>
                The monitor you have selected, has no recorded incidents yet.
              </Typography>
            )}
          </>
        ) : (
          <Box>
            <Button
              level="tertiary"
              label="Back"
              animate="slideLeft"
              img={<WestRoundedIcon />}
              onClick={() => navigate(-1)}
              sx={{
                backgroundColor: theme.palette.otherColors.fillGray,
                px: theme.gap.ml,
                mb: theme.gap.ml,
                "& svg.MuiSvgIcon-root": {
                  mr: theme.gap.small,
                  fill: theme.palette.otherColors.slateGray,
                },
              }}
            />
            <Box
              padding={theme.gap.xxl}
              gap={theme.gap.small}
              border={1}
              borderRadius={`${theme.shape.borderRadius}px`}
              borderColor={theme.palette.otherColors.graishWhite}
              backgroundColor={theme.palette.otherColors.white}
            >
              <Typography textAlign="center">No incidents, yet.</Typography>
            </Box>
          </Box>
        )}
      </Stack>
    </>
  );
};

export default Incidents;
