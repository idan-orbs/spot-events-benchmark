import * as S from "rescript-schema/src/S.res.mjs";

function panic(message) {
  throw new Error(`[rescript-envsafe] ${message}`);
}

function make(env = process.env) {
  return {
    env,
    isLocked: false,
    maybeMissingIssues: undefined,
    maybeInvalidIssues: undefined,
  };
}

function mixinMissingIssue(envSafe, issue) {
  if (envSafe.maybeMissingIssues) {
    envSafe.maybeMissingIssues.push(issue);
    return;
  }
  envSafe.maybeMissingIssues = [issue];
}

function mixinInvalidIssue(envSafe, issue) {
  if (envSafe.maybeInvalidIssues) {
    envSafe.maybeInvalidIssues.push(issue);
    return;
  }
  envSafe.maybeInvalidIssues = [issue];
}

function boolCoerce(value) {
  switch (value) {
    case "true":
    case "t":
    case "1":
      return true;
    case "false":
    case "f":
    case "0":
      return false;
    default:
      return value;
  }
}

function numberCoerce(value) {
  const coerced = Number(value);
  return Number.isNaN(coerced) ? value : coerced;
}

function bigintCoerce(value) {
  try {
    return BigInt(value);
  } catch {
    return value;
  }
}

function jsonCoerce(value) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function isOptionalSchema(schema) {
  return Boolean(schema && typeof schema.t === "object" && schema.t?.TAG === "option");
}

function candidateKey(candidate) {
  if (typeof candidate === "bigint") {
    return `bigint:${candidate.toString()}`;
  }
  if (candidate && typeof candidate === "object") {
    try {
      return `object:${JSON.stringify(candidate)}`;
    } catch {
      return "object:[unserializable]";
    }
  }
  return `${typeof candidate}:${String(candidate)}`;
}

function buildCandidates(input) {
  if (input === undefined) {
    return [undefined];
  }

  const candidates = [];
  const seen = new Set();

  for (const candidate of [
    input,
    boolCoerce(input),
    numberCoerce(input),
    bigintCoerce(input),
    jsonCoerce(input),
  ]) {
    const key = candidateKey(candidate);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    candidates.push(candidate);
  }

  return candidates;
}

function get(envSafe, name, schema, allowEmpty = false, fallback, devFallback, input) {
  if (envSafe.isLocked) {
    panic("EnvSafe is closed. Make a new one to get access to environment variables.");
  }

  const resolvedInput = input !== undefined ? input : envSafe.env[name];
  const isMissing = resolvedInput === undefined || (resolvedInput === "" && !allowEmpty);
  const isOptional = isOptionalSchema(schema);

  if (isMissing && !isOptional) {
    if (devFallback !== undefined && envSafe.env.NODE_ENV !== "production") {
      return devFallback;
    }
    if (fallback !== undefined) {
      return fallback;
    }
    mixinMissingIssue(envSafe, { name, input: resolvedInput });
    return undefined;
  }

  const parseInput = resolvedInput === "" && !allowEmpty ? undefined : resolvedInput;
  let lastError;

  for (const candidate of buildCandidates(parseInput)) {
    try {
      return S.parseOrThrow(candidate, schema);
    } catch (error) {
      lastError = error;
    }
  }

  mixinInvalidIssue(envSafe, { name, error: lastError, input: resolvedInput });
  return undefined;
}

function close(envSafe) {
  if (envSafe.isLocked) {
    panic("EnvSafe is already closed.");
  }

  envSafe.isLocked = true;

  if (!envSafe.maybeMissingIssues && !envSafe.maybeInvalidIssues) {
    return;
  }

  const lines = ["========================================"];

  if (envSafe.maybeInvalidIssues) {
    lines.push("Invalid environment variables:");
    for (const issue of envSafe.maybeInvalidIssues) {
      lines.push(`    ${issue.name}: ${issue.error?.message ?? String(issue.error)}`);
    }
  }

  if (envSafe.maybeMissingIssues) {
    lines.push("Missing environment variables:");
    for (const issue of envSafe.maybeMissingIssues) {
      lines.push(`    ${issue.name}: ${issue.input === "" ? "Disallowed empty string" : "Missing value"}`);
    }
  }

  lines.push("========================================");
  throw new TypeError(lines.join("\\n"));
}

export { close, get, make };
