import {ApiTokenManagement, ApiTokenScope} from "@vempain/vempain-common-frontend";
import dayjs from "dayjs";
import {apiTokenAPI, userAPI} from "../../services";
import {formatDateTime, stickyTableHeader} from "../../tools";

export function ApiTokens() {
    return <ApiTokenManagement
            api={apiTokenAPI}
            userAPI={userAPI}
            scopeOptions={[{value: ApiTokenScope.MCP_READ, label: "MCP_READ"}]}
            defaultScope={ApiTokenScope.MCP_READ}
            descriptionPlaceholder="vempain-mcp production"
            creationTitle="Create MCP read token"
            description="These tokens are restricted to read-only MCP endpoints, the configured network and their expiry."
            networkHint={() => "Enter the network vempain-mcp uses to call this backend."}
            createdTokenDescription={token => `Use this token from vempain-mcp. It expires ${formatDateTime(dayjs(token.expires_at))}.`}
            sticky={stickyTableHeader}
            formatDateTime={formatDateTime}
    />;
}
